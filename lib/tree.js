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
  var watcher, agent, doc, patch, keep;

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

  watcher = opts.watcher = opts.watcher || {};
  if (typeof watcher.followSymlinks !== 'boolean') {
    watcher.followSymlinks = false;
  }

  agent = opts.agent = opts.agent || {};
  if (typeof agent.scanInterval !== 'number') {
    agent.scanInterval = 20;
  }

  doc = opts.doc = opts.doc || {};
  doc.path = typeof doc.path === 'boolean' ? doc.path : true;
  doc.file = typeof doc.file === 'boolean' ? doc.file : false;

  keep = false;
  for (var key in doc) {
    if (doc[key]) keep = true;
  }
  if (!keep) delete opts.doc;

  patch = opts.patch = opts.patch || {};
  // enable patch noop operations for notification of overlapping directory creation
  patch.noop = typeof patch.noop === 'boolean' ? patch.noop : false;
  patch.previous = typeof patch.previous === 'boolean' ? patch.previous : false;

  debug("new tree with opts: '%j'", opts);

  Object.defineProperty(this, '_status', {
    enumerable: false,
    configurable: false,
    value: {
      vertices: 0
    }
  });
  
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

  if (typeof this._opts.onError === 'function') {
    this.on('$error', this._opts.onError);
  }

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
      watcher.on('change', listeners.change = function(filename) {
        // if (loading) return;
        tree._updateSource(filename);
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
      tree._activate().then(function() {
        resolve(tree);
      });

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

  if (filename.match(/.deleted$/)) return false;

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
  var vref, vertex, change, parent;
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
    parent = tools.parent.__; // parent vertex
    if (typeof vref === 'undefined') {
      vref = {};
      vref.__ = vertex = new Vertex(this, source.route.last, source, vref, parent);
      tools.setNested(source.route, this._vertices, vref);
      tools.setPropertyNested(source.route, this, vertex);
      if (!source.loading) {
        try {
          // stop agent detecting new key (would lead to sync _back_ out)
          parent.agent.previousKeys.push(vertex.key);
        } catch(e) {
          'ignore'
        }
        change = tools.createChange(this._opts, source);
        change.patch.push({
          op: 'add',
          path: '',
          value: {}
        })
      }
    } else {
      vertex = vref.__;
      vertex.sources.push(source);
      if (!source.loading && this._opts.patch.noop) {
        change = tools.createChange(this._opts, source);
        change.patch.push({
          // new directory added where vertex already defined in file
          //
          //  eg.      planets.js defines outer.neptune.radius
          //  then.    planets/outer/neptune directory is created
          //           ...will emit noops: 
          //                              planets/outer
          //                              planets/outer/neptune
          //
          //           because these vertices already existed
          //
          //           these noops are disabled by default but can
          //           be switched on :- subscibing systems may be
          //           interested in the doc tree's directory structure
          //
          op: 'noop',
          path: ''
        });
      }
    }
  }

  vertex.hasDirectory = true;
  if (change) this._emitter.emit('$patch', change);
  return true; // should remain watched
}

Tree.prototype._attachFile = function(source) {
  // TODO: how to handle eg. path/file.js and path/file.jpg
  var vref, vertex, parent, change, overlap;
  debug("_attachFile %s %s", source.loading, source.filePath);

  source.type = SourceType.FILE;
  source.route = source.treePath.split(path.sep);
  this._sources[source.filePath] = source;

  if (!source.loading) {
    change = tools.createChange(this._opts, source);
  }

  if (source.root) {
    source.route = [];
    vref = this._vertices;
    vref.__ = vertex = new Vertex(this, null, source, vref);
    vertex.value = this;
  } else {
    vref = tools.getNested(source.route, this._vertices);
    parent = tools.parent.__;
    if (typeof vref === 'undefined') {
      overlap = false;
      vref = {};
      vref.__ = vertex = new Vertex(this, source.route.last, source, vref, parent);
      tools.setNested(source.route, this._vertices, vref);
      if (!source.loading) {
        try {
          parent.agent.previousKeys.push(vertex.key);
        } catch (e) {
          'ignore';
        }
      
      }
      tools.setPropertyNested(source.route, this, vertex);
    } else {
      overlap = true;
      vertex = vref.__;
      // Push multiple source: got path shadow
      // TODO: if source is aleady file then collision exception??
      vertex.sources.push(source);
    }
  }

  source.vertex = vertex;
  vertex.hasFile = true;
  try {
    vertex.loadSource(source, source.loading, change, overlap);
    if (!source.loading) {
      this._emitter.emit('$patch', change);
    }
  } catch (e) {
    // TODO: logger
    if (this._emitter._events['$error']) {
      this._emitter.emit('$error', e);
    } else {
      console.error('error loading ' + source.filePath + ': ' + e.toString());
    }
  }
  return true; // should remain watched
}

Tree.prototype._updateSource = function(filename) {
  var filePath = filename.replace(this._opts.sourceMask, '');
  var source = this._sources[filePath];
  var vertex, change;
  if (!source) {
    debug('_updateSource missing original %s', filePath);
    return;
  }
  if (source.type !== SourceType.FILE) return;
  
  debug("_updateSource %s", filePath);
  vertex = source.vertex;
  if (!source) {
    debug('_updateSource missing source.vertex %s', filePath);
    return;
  }

  change = tools.createChange(this._opts, source);

  try {
    vertex.updateSource(source, change);
    this._emitter.emit('$patch', change);
  } catch (e) {
    // TODO: logger
    if (this._emitter._events['$error']) {
      return this._emitter.emit('$error', e);
    } else {
      console.error('error reloading ' + source.filePath + ': ' + e.toString());
    }
  }
  return;
}

Tree.prototype._detachSource = function(source) {
  var filePath = source.filename.replace(this._opts.sourceMask, '');
  var originalSource = this._sources[filePath];
  if (!originalSource) {
    debug('_detachSource missing original %s', filePath);
    return;
  }
  delete this._sources[filePath];
  var change = tools.createChange(this._opts, originalSource);
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
  var scanInterval = tree._opts.agent.scanInterval;
  var scanning = false;
  var started = false;
  return new Promise(function(resolve) {
    tree._scanner = setInterval(function() {
      if (scanning) {
        debug('scan overlap');
        return;
      }
      scanning = true;
      var token = {
        vertices: 0,
      };
      tree._vertices.__.agent.scan(token)
      .then(function() {
        scanning = false;
        tree._status.vertices = token.vertices;
        if (!started) resolve();
        started = true;
      })
      .catch(function(e) {
        debug('scan error: %s',e.toString(), token);
        scanning = false;
        if (!started) {
          resolve();
          started = true;
          process.nextTick(function() { // error after resolve for post resolve event listener
            tree._emitter.emit('$error', e); // TODO: ScanError
          });
          return;
        }
        tree._emitter.emit('$error', e);
      });
    }, scanInterval);
  });
}

