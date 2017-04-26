/* jshint esversion:6 */
require('./settings.js');

var RtmClient = require('@slack/client').RtmClient,
    CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS,
    fs = require("fs"),
    Stream = require("stream").Transform,
    https = require("https");

var bot_token = process.env.SLACK_BOT_TOKEN || '';
var rtm = new RtmClient(bot_token);

let channel;
let bot_id;

const fileDomain = "https://files.slack.com";
var download = function(url, filename, callback){
  var options = {
    hostname: fileDomain,
    path: url.replace(fileDomain, ""),
    method: "GET"
  };

  var req = https.request(url, function(response) {
    var data = new Stream();
    response.on("data", function(chunk) {
      data.push(chunk);
    });

    response.on("end", function() {
      fs.writeFileSync(`images/${filename}`, data.read());
      callback();
    });
  });

  req.on('error', (e) => {
    console.error(e);
  });

  req.end();
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
  console.log("RTM Connection Opened.");
});

rtm.on(CLIENT_EVENTS.RTM.RAW_MESSAGE, (message) => {
  var json = JSON.parse(message);  

  if(json.type === 'message' && json.user !== bot_id)
  {
    console.log(message);
    if (!!json.file && !!json.file.url_private_download)
    {
      download(json.file.url_private_download, json.file.name, function(){
        rtm.sendMessage(`Downloaded file: ${json.file.name}`, json.channel);
      });
    }
    else
    {
      rtm.sendMessage('Message received!', json.channel);
    }
  }
});

rtm.start();
