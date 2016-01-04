var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');
var readdirAsync = Promise.promisify(fs.readdir);
var lstatAsync = Promise.promisify(fs.lstat);

module.exports = Tools;

function Tools(/* tree */) {
  // this.tree = tree;
}

Tools.prototype.readdirStatAsync = function(filename) {
  return readdirAsync(filename).then(function(names) {
    return Promise.map(names, function(name) {
      var nextname = filename + path.sep + name;
      return lstatAsync(nextname).then(function(stat) {
        return {
          filename: nextname,
          stat: stat
        }
      });
    });
  });
}

Tools.prototype.readdirRecurseAsync = function(emitter, filename) {
  var _this = this;
  return _this.readdirStatAsync(filename).then(function(sources) {
    return Promise.map(sources, function(source) {
      emitter.emit('$load', source);
      if (! source.stat.isDirectory()) return;
      return _this.readdirRecurseAsync(emitter, source.filename);
    });
  });
}

Tools.prototype.getNested = function(route, tree) {
  var result = tree;
  try {
    for (var i = 0; i < route.length; i++) {
      result = result[route[i]];
    }
  } catch (e) {
    throw new Error('getNested() missing route: ' + route.join('/'));
  }
  return result;
}

Tools.prototype.setNested = function(route, tree, value) {
  var i, ref = tree;
  try {
    for (i = 0; i < route.length - 1; i++) {
      ref = ref[route[i]];
    }
    if (typeof ref === 'undefined') throw 'no'
  } catch (e) {
    throw new Error('setNested() missing route: ' + route.join('/'));
  }
  ref[route[i]] = value;
}

Tools.prototype.setPropertyNested = function(route, tree, vertex) {
  var i, key, ref = tree;
  try {
    for (i = 0; i < route.length - 1; i++) {
      ref = ref[route[i]];
    }
    key = route[i];
    if (typeof ref === 'undefined') throw 'no'
  } catch (e) {
    throw new Error('setPropertyNested() missing route: ' + route.join('/'));
  }

  Object.defineProperty(ref, key, {
    enumerable: true,
    configurable: true,
    get: function() {
      return vertex.getValue();
    },
    set: function(v) {
      vertex.setValue(v);
    }
  })

}

