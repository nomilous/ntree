module.exports = Tree;

var debug = require('debug')('ntree:Tree');
var Promise = require('bluebird');
var EventEmitter = require('events').EventEmitter;
var path = require('path');
var chokidar = require('chokidar');

var serializers = require('./serializers');
var Tools = require('./tools');
var Vertex = require('./vertex');
var SourceType = require('./constants/source_type');


function Tree(opts) {

  Object.defineProperty(this, '_opts', {
    enumerable: false,
    configurable: false,
    value: opts
  });

  this._opts.sourceMask = this._opts.sourceMask || new RegExp("^" + this._opts.mount + path.sep);
  this._opts.watcher = this._opts.watcher || {};
  if (typeof this._opts.watcher.followSymlinks !== 'boolean') {
    this._opts.watcher.followSymlinks = false;
  }

  Object.defineProperty(this, '_tools', {
    enumerable: false,
    configurable: false,
    value: new Tools(/*this*/)
  });
  
  // TODO: needed??
  // refs to all contained files and directories by keyed on filename
  Object.defineProperty(this, '_sources', {
    enumerable: false,
    configurable: false,
    value: {}
  });

  // refs to all vertices (stored in a key tree)
  Object.defineProperty(this, '_vertices', {
    enumerable: false,
    configurable: false,
    value: {}
  });

  Object.defineProperty(this, '_watcher', {
    enumerable: false,
    configurable: false,
    writable: true,
    value: null
  })

  Object.defineProperty(this, '_serializers', {
    enumerable: false,
    configurable: false,
    value: {}
  });

  this.registerSerializer(new serializers.Directory());
  this.registerSerializer(new serializers.Javascript());

  Object.defineProperty(this, '_emitter', {
    enumerable: false,
    configurable: false,
    value: new EventEmitter()
  });

  Object.defineProperty(this, 'on', {
    enumerable: false,
    configurable: false,
    value: function() {
      this._emitter.on.apply(this._emitter, arguments);
    }
  });

  Object.defineProperty(this, 'once', {
    enumerable: false,
    configurable: false,
    value: function() {
      this._emitter.once.apply(this._emitter, arguments);
    }
  });

}

Tree.prototype.registerSerializer = function(serializer) {
  var serializers = this._serializers;
  serializer.extensions.forEach(function(ext) {
    serializers[ext] = serializer;
  });
}

Tree.prototype._assemble = function() {
  var tree = this;
  return new Promise(function(resolve, reject) {
    var emitter = tree._emitter;
    var filename = tree._opts.mount;
    var watcher, loader;
    var loading = true;
    var first = true;

    var fakeStat = function(isDirectory, stat) {
      if (typeof stat === 'undefined' || typeof stat.isDirectory !== 'function') {
        stat = stat || {};
        stat.isDirectory = function() {
          return isDirectory;
        }
      }
      return stat;
    }

    tree.on('$load', loader = tree._attachSource.bind(tree));
    tree.on('$unload', loader = tree._detatchSource.bind(tree));

    tree._watcher = watcher = chokidar.watch(filename, tree._opts.watcher);

    // TODO: unwatch un-needed (upon detection)

    watcher.on('add', function(filename, stat) {
      stat = fakeStat(false, stat);
      emitter.emit('$load', {
        filename: filename,
        loading: loading,
        stat: stat,
        root: first,
      });
      first = false;
    });

    watcher.on('addDir', function(filename, stat) {
      stat = fakeStat(true, stat);
      emitter.emit('$load', {
        filename: filename,
        loading: loading,
        stat: stat,
        root: first,
      });
      first = false;
    });

    watcher.on('unlink', function(filename, stat) {
      stat = fakeStat(false, stat);
      emitter.emit('$unload', {
        filename: filename,
        loading: loading,
        stat: stat
      });
    });

    watcher.on('unlinkDir', function(filename, stat) {
      stat = fakeStat(true, stat);
      emitter.emit('$unload', {
        filename: filename,
        loading: loading,
        stat: stat
      });
    });

    watcher.on('ready', function() {
      loading = false;
      resolve(tree);
    });

  });

  // var _this = this;
  // return new Promise(function(resolve, reject) {
  //   var emitter = _this._emitter;
  //   var filename = _this._opts.mount;

  //   _this._tools.readdirRecurseAsync(emitter, filename).then(function(dir) {
  //     resolve(_this);
  //   }).catch(reject);
  // });
}

Tree.prototype._attachSource = function(source) {
  var filename = source.filename;
  var stat = source.stat;

  if (source.root) {
    source.filePath = '';
    source.treePath = '';
    source.ext = path.extname(filename);
  } else {
    source.filePath = filename.replace(this._opts.sourceMask, '');
    source.treePath = source.filePath;
    source.ext = path.extname(source.filePath);
  }

  if (stat.isDirectory()) return this._attachDirectory(source);
  if (typeof this._serializers[source.ext] === 'undefined') return;

  source.serializer = this._serializers[source.ext];
  source.treePath = source.treePath.replace(new RegExp(source.ext + "$"), '');
  this._attachFile(source);
}

Tree.prototype._attachDirectory = function(source) {
  var vref, vertex, tools = this._tools;
  debug("_attachDirectory %s %s", source.loading, source.filePath);

  source.type = SourceType.DIRECTORY;
  source.route = source.treePath.split(path.sep);
  this._sources[source.filePath] = source;

  if (source.root) {
    source.route = [];
    vref = this._vertices;
    vref.__ = vertex = new Vertex(this, source, vref);
    vertex.value = this;
  } else {
    vref = tools.getNested(source.route, this._vertices);
    if (typeof vref === 'undefined') {
      vref = {};
      vref.__ = vertex = new Vertex(this, source, vref);
      tools.setNested(source.route, this._vertices, vref);
      tools.setPropertyNested(source.route, this, vertex);
    } else {
      vertex = vref.__;
    }
  }

  vertex.hasDirectory = true;
}

Tree.prototype._attachFile = function(source) {
  // TODO: how to handle eg. path/file.js and path/file.jpg
  var vref, vertex, tools = this._tools;
  debug("_attachFile %s %s", source.loading, source.filePath);

  source.type = SourceType.FILE;
  source.route = source.treePath.split(path.sep);
  this._sources[source.filePath] = source;

  if (source.root) {
    source.route = [];
    vref = this._vertices;
    vref.__ = vertex = new Vertex(this, source, vref);
    vertex.value = this;
  } else {
    vref = tools.getNested(source.route, this._vertices);
    if (typeof vref === 'undefined') {
      vref = {};
      vref.__ = vertex = new Vertex(this, source, vref);
      tools.setNested(source.route, this._vertices, vref);
      tools.setPropertyNested(source.route, this, vertex);
    } else {
      vertex = vref.__;
      // Push multiple source: got path shadow
      // TODO: if source is aleady file then collision exception??
      vertex.sources.push(source);
    }
  }

  vertex.hasFile = true;
  vertex.loadSource(source.loading);
}

Tree.prototype._detatchSource = function(source) {
  var filePath = source.filename.replace(this._opts.sourceMask, '');
  var originalSource = this._sources[filePath];
  if (!originalSource) {
    debug('_detatchSource missing original %s', filePath);
  }
  if (originalSource.type == SourceType.DIRECTORY) {
    return this._detatchDirectory(originalSource);
  }
  return this._detatchFile(originalSource);
}

Tree.prototype._detatchDirectory = function(source) {
  debug("_detatchDirectory %s", source.filePath);
}

Tree.prototype._detatchFile = function(source) {
  debug("_detatchFile %s", source.filePath);
}

