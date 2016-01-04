module.exports = Javascript;

var extending = require('../extends/array');

function Javascript() {
  this.extensions = ['.js'];
  this.type = 'text';
  this.name = 'javascript';
}

Javascript.prototype.readSync = function(vertex) {
  var filename = vertex.sources.last.filename;
  delete require.cache[filename];
  return require(filename);
}
