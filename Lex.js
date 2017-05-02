/* jshint esversion:6 */

var ChattyProcess = require('./ChattyProcess').ChattyProcess;
var LexRuntime  = require('aws-sdk/clients/lexruntime');
var lexruntime = new LexRuntime({endpoint: 'https://runtime.lex.us-east-1.amazonaws.com', region: 'us-east-1'});

class Lex extends ChattyProcess {
  constructor() {
    super();
  }

  run (info, callback) {
    const text = info.text;
    const userId = info.userId;
    const params = {
      botAlias: 'Prod',
      botName: 'Chatty',
      inputText: text,
      userId: userId
    };

    lexruntime.postText(params, (err,data) => {
      if (err) console.error(err);
      else callback(data);
    });
  }
}

module.exports.Lex = Lex;
