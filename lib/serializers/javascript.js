module.exports = Javascript;

var debugs = require('../debugs')('ntree:javascript',['decodeSync', 'encodeSync']);
var decodeSync = debugs.decodeSync;
var encodeSync = debugs.encodeSync;
var path = require('path');
var fs = require('fs');
var util = require('util');
var os = require('os');

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

  var filename = vertex._info.fullname;
  var changeType = change.change;

  encodeSync('%s %j', filename, change);

  if (changeType == 'create') {

    var changeKey = change.key;
    var valueType = typeof change.value;
    var value = change.value;

    filename = filename + path.sep + changeKey + '.js';

    if (valueType == 'number' || valueType == 'string' || valueType == 'boolean') {
      fs.writeFileSync(filename, 'module.exports = ' + value.toString() + ';');
      return;
    }

    fs.writeFileSync(filename, this.stringify(value));
    return;

  }

  if (changeType == 'update') {
    fs.writeFileSync(filename, this.stringify(vertex._pointer));
    return;
  }

}

Javascript.prototype.stringify = function(object) {

  var lines = [];

  var indent = function(n) {
    var spaces = '';
    for (i = 0; i < n; i++) spaces += '  ';
    return spaces;
  }

  var recurse = function(obj, depth, key) {
    if (!key) {
      lines.push('module.exports = {');
    }

    var type = typeof obj;

    if (type == 'number' || type == 'boolean') {
      lines.push(util.format('%s\'%s\': %s,', indent(depth), key, obj));
      return
    }

    if (type == 'string') {
      lines.push(util.format('%s\'%s\': \'%s\',', indent(depth), key, obj));
      return
    }

    if (key) {
      lines.push(util.format('%s\'%s\': {', indent(depth), key));
    }

    Object.keys(obj).forEach(function(key) {
      depth++;
      recurse(obj[key], depth, key);
      depth--;
    });

    lines.push(indent(depth) + '}' + (depth == 0 ? ';' : ','));
  }

  recurse(object, 0);

  return lines.join(os.EOL);

}