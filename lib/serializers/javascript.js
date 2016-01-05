module.exports = Javascript;

var debug = require('debug')('ntree:Javascript');
var extending = require('../extends/array');

function Javascript() {
  this.extensions = ['.js'];
  this.type = 'text';
  this.name = 'javascript';
}

Javascript.prototype.readSync = function(vertex) {
  var filename = vertex.sources.last.filename;
  try {
    delete require.cache[filename];
    return require(filename);
  } catch (e) {
    debug('error in readSync: %s: %s', vertex.sources.last.filePath, e.toString());
    return {} // so that broken file does not stomp existing branch at same address
  }
}
