module.exports = Javascript;

var fs = require('fs');
var util = require('util');
var os = require('os');

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
  debug('read %s', filename);
  delete require.cache[filename];
  return require(filename);
}

Javascript.prototype.writeSync = function(source) {
  var filename = source.filename;
  debug('write %s', filename);
  fs.writeFileSync(filename, this.stringify(source.vertex.getValue()));
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

    if (type == 'undefined') return;
    if (type == 'number' || type == 'boolean' || type == 'function') {
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
