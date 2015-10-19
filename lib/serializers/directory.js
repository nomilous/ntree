module.exports = Directory;

var debugs = require('../debugs')('ntree:directory',['decodeAsync']);
var decodeAsync = debugs.decodeAsync;

var Promise = require('bluebird');
var fs = require('fs');
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
