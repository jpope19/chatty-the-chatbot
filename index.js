/** jshint esversion6 */

require('./settings.js');

var RtmClient = require('@slack/client').RtmClient;
var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;

var bot_token = process.env.SLACK_BOT_TOKEN || '';
var rtm = new RtmClient(bot_token);

let channel;
let bot_id;

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
    rtm.sendMessage('Message received!', json.channel);
  }
});

rtm.start();
