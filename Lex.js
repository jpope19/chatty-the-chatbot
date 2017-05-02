/* jshint esversion:6 */

var ChattyProcess = require('./ChattyProcess').ChattyProcess;
var LexRuntime = require('aws-sdk/clients/lexruntime');

console.log(LexRuntime);

class Lex extends ChattyProcess {
  constructor() {
    super();
  }

  run (info, callback) {
    const text = info.text;
    const userId = info.userId;
    const url = `https://runtime.lex.us-east-1.amazonaws.com/bot/Chatty/alias/Prod/user/${userId}/text`;

/*    request.post(url)
      .on('response', (response) => {})
      .on('error', (error) => {});*/
  }
}

module.exports.Lex = Lex;
