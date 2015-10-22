module.exports = Directory;

var debugs = require('../debugs')('ntree:directory',['decodeAsync']);
var decodeAsync = debugs.decodeAsync;

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

  console.log('create directory', change);
  var fullname = vertex._info.fullname;
  var key = change.key;
  var newName = fullname + path.sep + key;
  fs.mkdirSync(newName);

}
