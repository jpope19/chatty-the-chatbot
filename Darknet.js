/* jshint esversion:6 */
require('./ChattyProcess.js');

var exec = require('child_process').exec;

class Darknet extends ChattyProcess {
  constructor() {}

  static cmd (filename) {
    return `./darknet detect cfg/yolo.cfg weights/yolo.weights images/${filename}`;
  }

  run (filename, callback) {
    // run the yolo command -- this can be swapped out with any  object detection algorithm of choice
    exec(Darknet.cmd(filename), function(error, stdout, stderr) {
      // post the new picture to the slack channel -- remember, darknet saves the image as predictions.png
      callback('predictions.png');
    });
  }
}