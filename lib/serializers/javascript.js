module.exports = Javascript;

var debugs = require('../debugs')('ntree:javascript',['decodeSync']);
var decodeSync = debugs.decodeSync;

function Javascript() {

  this.extensions = ['.js'];
  this.type = 'text';
  this.name = 'javascript';

}

Javascript.prototype.decodeSync = function(vertex) {

  var fullname = vertex._info.fullname;
  
  decodeSync('%s', fullname);

  delete require.cache[fullname];
  return require(fullname);

}
