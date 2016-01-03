var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');
var readdirAsync = Promise.promisify(fs.readdir);
var lstatAsync = Promise.promisify(fs.lstat);

module.exports = Tools;

function Tools(tree) {
  this.tree = tree;
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

