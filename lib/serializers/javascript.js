module.exports = Javascript;

var debugs = require('../debugs')('ntree:javascript',['decodeSync']);
var decodeSync = debugs.decodeSync;
var path = require('path');
var fs = require('fs');

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


Javascript.prototype.encodeSync = function(vertex, change) {

  console.log('create javascript file', change);

  var filename = vertex._info.fullname;
  var changeType = change.change;

  if (changeType == 'create') {

    var changeKey = change.key;
    var valueType = typeof change.value;
    var value = change.value;

    filename = filename + path.sep + changeKey + '.js';

    if (valueType == 'number' || valueType == 'string' || valuetype == 'boolean') {

      fs.writeFileSync(filename, 'module.exports = ' + value.toString() + ';');

    }

  }

}
