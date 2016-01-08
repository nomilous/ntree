module.exports = Javascript;

var debug = require('debug')('ntree:Javascript');
var extending = require('../extends/array');

function Javascript() {
  this.extensions = ['.js'];
  this.type = 'text';
  this.name = 'javascript';
}

// throw on problem reading
Javascript.prototype.readSync = function(source) {
  var filename = source.filename;
  delete require.cache[filename];
  return require(filename);
}
