/* jshint esversion:6 */
require('./settings.js');

var RtmClient = require('@slack/client').RtmClient,
    CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS,
    fs = require('fs'),
    request = require('request'),
    exec = require('child_process').exec;

var bot_token = process.env.SLACK_BOT_TOKEN || '';
var access_token = process.env.ACCESS_TOKEN || '';
var rtm = new RtmClient(bot_token);

let channel;
let bot_id;

var cmd = (filename) => {
  return `./darknet detect cfg/yolo.cfg weights/yolo.weights images/${filename}`;
};

var download = (url, filename, callback) => {
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
  for (const g of rtmStartData.groups)
  {
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
    if (!!json.file && !!json.file.url_private)
    {
      rtm.sendMessage('Message received. Interpretting image...', json.channel);
      rtm.sendTyping(json.channel);
   
      download(json.file.url_private, json.file.name, () => {
        console.log('downloaded file');
        rtm.sendMessage(`Downloaded file: ${json.file.name}`, json.channel);
        rtm.sendTyping(json.channel);
        exec(cmd(json.file.name), function(error, stdout, stderr) {
          request.post({
            url: 'https://slack.com/api/files.upload',
            formData: {
              token: bot_token,
              filename: json.file.name,
              file: fs.createReadStream('predictions.png'),
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
    else
    {
      rtm.sendMessage('Message received!', json.channel);
    }
  }
});

rtm.start();
