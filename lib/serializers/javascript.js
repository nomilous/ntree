module.exports = Javascript;

var debugs = require('../debugs')('ntree:javascript',['read']);
var debugRead = debugs.read;

function Javascript() {

  this.extensions = ['.js'];
  
  this.type = 'text';
  this.name = 'javascript';

}

Javascript.prototype.decodeSync = function(vertex) {

  var filename = vertex._info.fullname;

  debugRead('%s', filename);

  delete require.cache[filename];

  return require(filename);

}
