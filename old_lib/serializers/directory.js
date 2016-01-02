module.exports = Directory;

var debugs = require('../debugs')('ntree:directory',['decodeAsync', 'encodeSync']);
var decodeAsync = debugs.decodeAsync;
var encodeSync = debugs.encodeSync;

var Promise = require('bluebird');
var fs = require('fs');
var path = require('path');
var readdir = Promise.promisify(fs.readdir);


function Directory() {

  this.extensions = ['.directory']; // for key sake
  this.type = 'fs';
  this.name = 'directory';

}

Directory.prototype.decodeAsync = function(vertex) {

  var fullname = vertex._info.fullname;
  decodeAsync('%s', fullname);
  return readdir(fullname);

}


Directory.prototype.encodeSync = function(vertex, change) {

  var fullname = vertex._info.fullname;
  encodeSync('%s %j', fullname, change);

  var key = change.key;
  var newName = fullname + path.sep + key;
  fs.mkdirSync(newName);

}
