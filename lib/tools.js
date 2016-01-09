var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');
var readdirAsync = Promise.promisify(fs.readdir);
var lstatAsync = Promise.promisify(fs.lstat);

var SourceType = require('./constants/source_type');

module.exports = Tools;

function Tools(/* tree */) {
  // this.tree = tree;
}

// Tools.prototype.readdirStatAsync = function(filename) {
//   return readdirAsync(filename).then(function(names) {
//     return Promise.map(names, function(name) {
//       var nextname = filename + path.sep + name;
//       return lstatAsync(nextname).then(function(stat) {
//         return {
//           filename: nextname,
//           stat: stat
//         }
//       });
//     });
//   });
// }

// Tools.prototype.readdirRecurseAsync = function(emitter, filename) {
//   var _this = this;
//   return _this.readdirStatAsync(filename).then(function(sources) {
//     return Promise.map(sources, function(source) {
//       emitter.emit('$load', source);
//       if (! source.stat.isDirectory()) return;
//       return _this.readdirRecurseAsync(emitter, source.filename);
//     });
//   });
// }

Tools.prototype.createChange = function(opts, source) {
  if (!opts.doc) {
    return { patch: [] };
  }
  var change = {
    doc: {},
    patch: [],
  }
  if (opts.doc.path) change.doc.path = '/' + source.treePath;
  if (opts.doc.file) change.doc.file = '/' + source.filePath;
  return change;
}

Tools.prototype.getNested = function(route, tree) {
  var result = tree;
  delete this.parent;
  try {
    for (var i = 0; i < route.length; i++) {
      this.parent = result;
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

Tools.prototype.listFileSources = function(vertex) {
  return vertex.sources.filter(function(source) {
    return source.type === SourceType.FILE;
  });
}

Tools.prototype.getKeysWithOnlyThisSource = function(vertex, source) {
  return Object.keys(vertex.vref).filter(function(key) {
    var vref;
    if (key === '__') return false;
    if (!(vref = vertex.vref[key])) return false;
    if (vref.__.sources.length !== 1) return false;
    if (vref.__.sources[0].filePath !== source.filePath) return false;
    return true;
  });
}

Tools.prototype.getKeysWithThisAndOtherSources = function(vertex, source) {
  return Object.keys(vertex.vref).filter(function(key) {
    var vref;
    if (key === '__') return false;
    if (!(vref = vertex.vref[key])) return false;
    if (vref.__.sources.length <= 1) return false;
    for (var i = 0; i < vref.__.sources.length; i++) {
      if (vref.__.sources[i].filePath === source.filePath) return true;
    }
    return false;
  });
}

Tools.prototype.getNestedVerticesWithOnlyThisSource = function(vertex, source) {
  // var keys = [];
  var vertices = [];
  var recurse = function(vertex) {
    if (vertex.sources.length === 1) {
      if (vertex.sources[0].filePath === source.filePath) {
        // routes.push(keys.slice());
        vertices.push(vertex);
      }
    }
    Object.keys(vertex.vref).forEach(function(key) {
      if (key === '__') return;
      // keys.push(key);
      recurse(vertex.vref[key].__);
      // keys.pop(key);
    });

  }
  recurse(vertex);
  // return routes;
  return vertices;
}

Tools.prototype.diffKeys = function(oldKeys, newKeys) {
  var result = {};
  var offset = 0;
  for (i = 0;; i++) {
    var o = oldKeys[i];
    var n = newKeys[i - offset];

    if (!o && !n) break;

    if (!o && n) {
      if (!result.added) result.added = [];
      result.added.push(n);
      continue;
    }

    if (o !== n) {
      if (!result.removed) result.removed = [];
      result.removed.push(o);
      offset++;
    }
  }

  return result;
}

Tools.prototype.conditionalDelete = function(array, comparator) {
  if (!comparator) comparator = function() {return true;}
  for (var i = array.length - 1; i >= 0; i--) {
    if (comparator(array[i])) array.splice(i, 1);
  }
}

Tools.prototype.collapePatch = function(change) {
  var op, key;
  var previousAddPath; // reverse iter means this is first parent then sibling
                       // so if next is nested and still 'add' then next can be
                       // omitted (as constituent of parent add)

  var previousReplacePath; // if add is constituent of previous replace, ignore
  var previousRemove; // reassembling removed from subkeys if previous
  var i = change.patch.length;

  while (i--) {
    op = change.patch[i];
    if (op.op === 'add') {
      if (previousReplacePath) {
        if (op.path.indexOf(previousReplacePath) == 0) {
          // ignore add nested in replace
          change.patch.splice(i, 1);
          continue;
        }
      }
      if (!previousAddPath) {
        previousAddPath = op.path;
        continue;
      }
      if (op.path.indexOf(previousAddPath) == 0) {
        // is constituent of parent (remove the nested 'add')
        change.patch.splice(i, 1);
        continue;
      }
      // no longer 
      previousAddPath = op.path;
    }
    if (op.op === 'replace') {
      previousReplacePath = op.path;
    }
    if (op.op === 'remove') {
      if (!previousRemove) {
        previousRemove = op;
        continue;
      }
      if (op.path.indexOf(previousRemove.path) == 0) {
        change.patch.splice(i, 1);
        // reassemble
        if (typeof op.previous !== 'undefined') {
          key = op.path.substring(previousRemove.path.length + 1);
          if (key.indexOf('/') >= 0) continue; // TODO: might want to set nested
          previousRemove.previous[key] = op.previous;
        }
        continue;
      }
      previousRemove = op;
    }
  }
}
