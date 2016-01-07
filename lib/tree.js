module.exports = Tree;

var debug = require('debug')('ntree:Tree');
var Promise = require('bluebird');
var EventEmitter = require('events').EventEmitter;
var path = require('path');
var chokidar = require('chokidar');

var serializers = require('./serializers');
var Tools = require('./tools'), tools = new Tools();
var Vertex = require('./vertex');
var SourceType = require('./constants/source_type');
var extending = require('./extends/string');


function Tree(opts) {

  Object.defineProperty(this, '_opts', {
    enumerable: false,
    configurable: false,
    value: opts
  });

  if (typeof opts.mount !== 'string') throw new Error('Tree missing opts.mount');
  if (opts.mount.length === 1) throw new Error('Tree opts.mount at root not supported');
  if (opts.mount.last === '/') opts.mount = opts.mount.substr(0, opts.mount.length - 1);

  // TODO: syncIn and syncOut exclude list (by treePath)

  if (typeof opts.syncIn !== 'boolean') opts.syncIn = true;
  if (typeof opts.syncOut !== 'boolean') opts.syncOut = true;

  opts.sourceMask = opts.sourceMask || new RegExp("^" + opts.mount + path.sep);
  opts.watcher = opts.watcher || {};
  if (typeof opts.watcher.followSymlinks !== 'boolean') {
    opts.watcher.followSymlinks = false;
  }
  opts.agents = opts.agents || {};
  if (typeof opts.agents.scanInterval !== 'number') {
    opts.agents.scanInterval = 20;
  }

  debug("new tree with opts: '%j'", opts);
  
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
  });

  Object.defineProperty(this, '_scanner', {
    enumerable: false,
    configurable: false,
    writable: true,
    value: null
  });

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

Tree.prototype._stop = function() {
  this._opts.syncIn = false;
  this._opts.syncOut = false;
  clearInterval(this._scanner);
  this._watcher.close();
}

Tree.prototype._start = function() {
  var tree = this;
  return new Promise(function(resolve, reject) {
    var emitter = tree._emitter;
    var filename = tree._opts.mount;
    var watcher;
    var loading = true;
    var first = true;
    var listeners = {};

    var fakeStat = function(isDirectory, stat) {
      if (typeof stat === 'undefined' || typeof stat.isDirectory !== 'function') {
        stat = stat || {};
        stat.isDirectory = function() {
          return isDirectory;
        }
      }
      return stat;
    }

    
    tree.on('$unload', tree._detachSource.bind(tree));
    tree.on('$load', function(source) {
      if (tree._attachSource(source)) return; // keep watching
      watcher.unwatch(source.filename);
    });

    tree._watcher = watcher = chokidar.watch(filename, tree._opts.watcher);

    // TODO: unwatch un-needed (upon detection)

    watcher.on('add', listeners.add = function(filename, stat) {
      stat = fakeStat(false, stat);
      emitter.emit('$load', {
        filename: filename,
        loading: loading,
        stat: stat,
        root: first,
      });
      first = false;
    });

    watcher.on('addDir', listeners.addDir = function(filename, stat) {
      stat = fakeStat(true, stat);
      emitter.emit('$load', {
        filename: filename,
        loading: loading,
        stat: stat,
        root: first,
      });
      first = false;
    });

    watcher.on('unlink', listeners.unlink = function(filename, stat) {
      stat = fakeStat(false, stat);
      emitter.emit('$unload', {
        filename: filename,
        loading: loading,
        stat: stat
      });
    });

    watcher.on('unlinkDir', listeners.unlinkDir = function(filename, stat) {
      stat = fakeStat(true, stat);
      emitter.emit('$unload', {
        filename: filename,
        loading: loading,
        stat: stat
      });
    });

    if (tree._opts.syncIn) {
      watcher.on('change', function(filename) {
        debug('changed %s', filename);
      });
    }

    watcher.once('ready', function() {
      loading = false;
      if (!tree._opts.syncIn) {
        for (var event in listeners) {
          watcher.removeListener(event, listeners[event]);
        }
        watcher.close();
      }
      tree._activate();
      resolve(tree);
    });

  });

  // var _this = this;
  // return new Promise(function(resolve, reject) {
  //   var emitter = _this._emitter;
  //   var filename = _this._opts.mount;

  //   tools.readdirRecurseAsync(emitter, filename).then(function(dir) {
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
  if (typeof this._serializers[source.ext] === 'undefined') return false;

  source.serializer = this._serializers[source.ext];
  source.treePath = source.treePath.replace(new RegExp(source.ext + "$"), '');
  return this._attachFile(source);
}

Tree.prototype._attachDirectory = function(source) {
  var vref, vertex;
  debug("_attachDirectory %s %s", source.loading, source.filePath);

  source.type = SourceType.DIRECTORY;
  source.route = source.treePath.split(path.sep);
  this._sources[source.filePath] = source;

  if (source.root) {
    source.route = [];
    vref = this._vertices;
    vref.__ = vertex = new Vertex(this, null, source, vref);
    vertex.value = this;
  } else {
    vref = tools.getNested(source.route, this._vertices);
    if (typeof vref === 'undefined') {
      vref = {};
      vref.__ = vertex = new Vertex(this, source.route.last, source, vref, tools.parent.__);
      tools.setNested(source.route, this._vertices, vref);
      tools.setPropertyNested(source.route, this, vertex);
    } else {
      vertex = vref.__;
      vertex.sources.push(source);
    }
  }

  vertex.hasDirectory = true;
  return true; // should remain watched
}

Tree.prototype._attachFile = function(source) {
  // TODO: how to handle eg. path/file.js and path/file.jpg
  var vref, vertex;
  debug("_attachFile %s %s", source.loading, source.filePath);

  source.type = SourceType.FILE;
  source.route = source.treePath.split(path.sep);
  this._sources[source.filePath] = source;

  if (source.root) {
    source.route = [];
    vref = this._vertices;
    vref.__ = vertex = new Vertex(this, null, source, vref);
    vertex.value = this;
  } else {
    vref = tools.getNested(source.route, this._vertices);
    if (typeof vref === 'undefined') {
      vref = {};
      vref.__ = vertex = new Vertex(this, source.route.last, source, vref, tools.parent.__);
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
  return true; // should remain watched
}

Tree.prototype._detachSource = function(source) {
  var filePath = source.filename.replace(this._opts.sourceMask, '');
  var originalSource = this._sources[filePath];
  if (!originalSource) {
    debug('_detachSource missing original %s', filePath);
    return;
  }
  delete this._sources[filePath];
  var change = {
    doc: originalSource.treePath,
    patch: []
  };
  if (originalSource.type == SourceType.DIRECTORY) {
    this._detachDirectory(originalSource, change);
  } else {
    this._detachFile(originalSource, change);
  }

  if (change.patch.length == 0) return;
  this._emitter.emit('$patch', change);
}

Tree.prototype._detachDirectory = function(source, change) {
  debug("_detachDirectory %s", source.filePath);
  if (!source.route) return; // error? to where? happens from watcher event
  var vref = tools.getNested(source.route, this._vertices);
  var vertex = vref.__;
  return vertex.unloadSource(source, change);
}

Tree.prototype._detachFile = function(source, change) {
  debug("_detachFile %s", source.filePath);
  if (!source.route) return; // error? to where? happens from watcher event
  var vref = tools.getNested(source.route, this._vertices);
  var vertex = vref.__;
  return vertex.unloadSource(source, change);
}

Tree.prototype._activate = function() {
  // TODO: divide scan into multiple ticks to not hog
  var tree = this;
  var scanInterval = tree._opts.agents.scanInterval;
  var running = false;
  tree._scanner = setInterval(function() {
    if (running) {
      debug('scan overlap');
      return;
    }
    running = true;
    var token = {
      vertices: 0,
      // leaves: 0,
    };
    tree._vertices.__.agent.scan(token)
    .then(function() {
      running = false;
    })
    .catch(function(e) {
      debug('scan error: %s',e.toString(), token);
      running = false;
    });
  }, scanInterval);
}

