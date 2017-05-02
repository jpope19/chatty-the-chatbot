/* jshint esversion:6 */
require('./settings.js');
var Darknet = require('./Darknet.js').Darknet;
var Lex = require('./Lex.js').Lex;

var RtmClient = require('@slack/client').RtmClient,
    CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS,
    fs = require('fs'),
    request = require('request');

var bot_token = process.env.SLACK_BOT_TOKEN || '';
var access_token = process.env.ACCESS_TOKEN || '';
var rtm = new RtmClient(bot_token);

let channel;
let bot_id;

// channel ids for ims for each user between bot/user
var bot_ims_channels = {};

var image_process = new Darknet();
var text_process = new Lex();

var download = (url, filename, callback) => {
  // slack saves the image locally and makes us make an additional https request to get access to it.
  // 302 redirect response caused if authorization isn't correct.
  // saves image to the images folder
  var req = request({
    url: url,
    headers: {
      'Authorization': `Bearer ${bot_token}`
    }
  }).pipe(fs.createWriteStream(`./images/${filename}`));
  
  req.on('close', callback);
};

// The client will emit an RTM.AUTHENTICATED event on successful connection, with the `rtm.start` payload if you want to cache it
rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, (rtmStartData) => {
  bot_id = rtmStartData.self.id;

  for (const ims of rtmStartData.ims)
  {
    bot_ims_channels[ims.user] = ims.id;
  }

  for (const g of rtmStartData.groups)
  {
    // default channel -- testing out how to send a message.
    // doesn't do anything, but could be utilized to send a message on startup.
    if (g.name === 'chatty-test')
    {
      channel = g.id;
      break;
    }
  }
  console.log(`Set Bot ID: ${bot_id}`);
  console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, set channel to ${channel}`);
});

rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, () =>  {
  console.log('RTM Connection Opened.');
});

rtm.on(CLIENT_EVENTS.RTM.RAW_MESSAGE, (message) => {
  var json = JSON.parse(message);  

  if(json.type === 'message' && json.user !== bot_id)
  {
    // only respond if spoken to directly or in the channel specified at startup
    // if it was in a public channel -- see if chatty was mentioned
    var mentioned = false;
    if (!!json.text && json.text.indexOf(`@${bot_id}`) > -1)
      mentioned = true;

    if (mentioned || bot_ims_channels[json.user] === json.channel || channel === json.channel)
    {
      var info = {userId: json.user};
      if (json.subtype === 'file_share' && !!json.file && !!json.file.url_private)
      {
        rtm.sendMessage('Message received. Interpretting image...', json.channel);
        rtm.sendTyping(json.channel);

        // download saves the file as predictions.png -- need to update the darknet runnable to change that...   
        download(json.file.url_private, json.file.name, () => {
          console.log('downloaded file');
          rtm.sendMessage(`Downloaded file: ${json.file.name}`, json.channel);
          rtm.sendTyping(json.channel);

          info.file_name = json.file.name;
          image_process.run(info, (resultFileName) => {
            // post the new picture to the slack channel -- remember, darknet saves the image as predictions.png
            request.post({
              url: 'https://slack.com/api/files.upload',
              formData: {
                token: bot_token,
                filename: json.file.name,
                file: fs.createReadStream(resultFileName),
                filetype: 'png',
                title: `Title: ${json.file.name}`,
                channels: json.channel
              }
            }, function(err, response) {
              console.log(`Response: ${response.statusCode} ${response.statusMessage}`);
            });
          });
        });
      }
      // TODO - add text analytics
      else
      {
        info.text = json.text;
        text_process.run(info, (response) => {
          rtm.sendMessage(response.message, json.channel);
        });
      }
    }
  }
});

rtm.start();
