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
  var op;
  var previousAddPath; // reverse iter means this is first parent then sibling
                       // so if next is nested and still 'add' then next can be
                       // omitted (as constituent of parent add)
  var previousReplacePath;
                       // if add is constituent of previous replace, ignore
  var i = change.patch.length;

  while (i--) {
    op = change.patch[i];
    if (op.op === 'add') {
      if (previousReplacePath) {
        if (op.path.indexOf(previousReplacePath) == 0) {
          console.log('ignore', op.path);
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
  }
}
