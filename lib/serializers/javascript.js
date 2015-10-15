module.exports = Javascript;

var debugs = require('../debugs')('ntree:javascript',['read']);
var debugRead = debugs.read;

function Javascript() {

  // nodejs or iojs (ie, uses module.exports)

  this.extensions = ['.js'];
  
  this.typename = 'javascript';

}

Javascript.prototype.read = function(vertex) {

  var filename = vertex._info.fullname;

  debugRead('%s', filename);

  delete require.cache[filename];

  return require(filename);

}
