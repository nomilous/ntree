module.exports = Vertex;

var extending = require('./extends/array');
var SourceType = require('./constants/source_type');
var Agent = require('./agent');
var Tools = require('./tools'), tools = new Tools();
var Errors = require('./errors');

function Vertex(tree, key, source, vref, parent) {

  Object.defineProperty(this, 'tree', {
    enumerable: false,
    configurable: false,
    value: tree
  });

  Object.defineProperty(this, 'key', {
    enumerable: true,
    configurable: false,
    value: key
  });

  // TODO: sources as list may be better that array... consider
  Object.defineProperty(this, 'sources', {
    enumerable: false,
    configurable: false,
    value: [source]
  });

  // reference to this objects parent in tree._vertices
  Object.defineProperty(this, 'vref', {
    enumerable: false,
    configurable: false,
    value: vref
  });

  Object.defineProperty(this, 'agent', {
    enumerable: false,
    configurable: false,
    value: new Agent(this, tree._opts.agents)
  });

  // if (source.type === SourceType.DIRECTORY) {
  //   this.agents.push.sources.push(new DirectoryAgent)
  // }


  /*
   * Vertex can hasFile and hasDirectory,
   * this occurs when directories shadow file's tree content
   * 
   * eg.
   * 
   *  planets.js defines outer.saturn.name = 'Saturn'
   *  planets/outer/saturn.js defines .radius
   *
   * TODO: syncMode for when writing new key at vertex
   *       with hasDirectoy and hasFile, should the key
   *       write into the file or th dir
   */

  Object.defineProperty(this, 'hasDirectory', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: null
  });

  Object.defineProperty(this, 'hasFile', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: null
  });


  Object.defineProperty(this, 'value', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: {}
  });

  Object.defineProperty(this, 'parent', {
    enumareble: false,
    configurable: false,
    value: parent
  });

  var route; // loaded only if needed
  Object.defineProperty(this, 'route', {
    enumareble: false,
    configurable: false,
    get: function() {
      if (route) return route;
      route = [];
      route.unshift(this.key);
      var parent = this.parent
      if (!parent) return route;
      if (parent.key) route.unshift(parent.key);
      while(parent = parent.parent) {
        if (parent.key) route.unshift(parent.key);
      };
      return route;
    }
  });

  Object.defineProperty(this, 'deleted', {
    enumareble: false,
    configurable: false,
    writable: true,
    value: false,
  });
}

Vertex.prototype.getValue = function() {
  // TODO: if deleted
  var filtered, confine = this.tree._confine;
  if (confine) {
    if (typeof this.value !== 'object') return this.value;
    filtered = {};
    for (var key in this.value) {
      if (this.vref[key].__.hasSource(confine)) {
        filtered[key] = this.value[key];
      }
    }
    return filtered;
  }
  return this.value;
}

Vertex.prototype.setValue = function(value) {
  // TODO: if deleted...
  console.log('SET', this.deleted, value);
}

Vertex.prototype.MultipleSourceError = function(sources) {
  return new Errors.MultipleSourceError(this.route, sources);
}

Vertex.prototype.listSourcesByType = function(type) {
  return this.sources.filter(function(s) {
    s.filePath === filePath;
  });
}

Vertex.prototype.hasSource = function(source) {
  var i = this.sources.length;
  while (i--) {
    if (this.sources[i].filePath === source.filePath) {
      return true;
    } 
  }
  return false;
}

Vertex.prototype.selectSource = function() {
  if (this.sources.length == 1) return this.sources[0];
  var i;
  if (this.tree._opts.source.select === 'last') {
    i = this.sources.length
    while (i--) {
      if (this.sources[i].type === SourceType.FILE) {
        return this.sources[i];
      }
    }
  } else {
    for (i = 0; i < this.sources.length; i++) {
      if (this.sources[i].type === SourceType.FILE) {
        return this.sources[i];
      }
    }
  }
}

Vertex.prototype.onChanged = function(keyChanges) {
  var source = this.selectSource();
  var change = tools.createChange(this.tree._opts, source);
  var parentOverlap = false; // to no add to previousKeys in loadKey

  for (var i = 0; i < keyChanges.added.length; i++) {
    // remove the new key and rebuild with vref, tref recurse
    var key = keyChanges.added[i];
    var value = this.value[key]; // as just detected as added
    delete this.value[key];
    this.loadKey(false, source, this.vref, this.value, key, value, change, parentOverlap, 'add');
  }

  try {
    this.tree._confine = source;
    this.tree._skip = source;
    source.serializer.writeSync(source);
    this.tree._confine = null;
  } catch (e) { // TODO: error into patch?
    // TODO: SyncOutError
    // TODO: undo change on syncput error? (mode)
    // TODO: include error in patch?
    this._tree._emitter.emit('$error', e);
  }
  // tools.collapePatch(change);
  this.tree._emitter.emit('$patch', change);
}

Vertex.prototype.loadSource = function(source, loading, change, overlap) {
  // var source = this.sources.last;
  var value = source.serializer.readSync(source); // throws on problem reading
  var vref = this.vref; // vertex reference tree
  var tref = this.value; // user tree
  var _this = this;
  var multipleSources;

  if (typeof value !== 'object') { // TODO: native types, support array
    if (this.sources.length > 1) {
      multipleSources = tools.listFileSources(this);
      this.sources.pop();
      throw this.MultipleSourceError(multipleSources);
    }
    this.value = value;
  } else {
    for (var key in value) {
      this.loadKey(loading, source, vref, tref, key, value[key], change, overlap);
    }
  }

  if (!loading) {
    if (!overlap) {
      change.patch.length = 0;
      change.patch.push({
        op: 'add',
        path: '',
        value: this.value
      });
      return;
    }
    tools.collapePatch(change);
  }
}

Vertex.prototype.loadKey = function(loading, source, vref, tref, key, value, change, parentOverlap, op) {
  var vertex;
  var nextVref = tools.getNested([key], vref);
  var overlap;
  var path;
  var multipleSources;
  var previous, patch;

  op = op || 'add';

  if (typeof nextVref === 'undefined') {
    overlap = false;
    nextVref = {};
    nextVref.__ = vertex = new Vertex(this.tree, key, source, nextVref, vref.__);
    tools.setNested([key], vref, nextVref);
    tools.setPropertyNested([key], tref, vertex);
    if (!loading && parentOverlap) {
      // new branch's root key, add to known keys so that
      // agent does not find diff leading to outSync as if
      // addition originated in tree.
      vref.__.agent.previousKeys.push(vertex.key);
    }
  } else {
    vertex = nextVref.__;
    if (op === 'add') {
      overlap = true;
      vertex.sources.push(source);
    }
    if (op === 'replace') {
      previous = vertex.value;
      vertex.value = {};
      vertex.agent.previousKeys = [];
    }
  }

  if (typeof value !== 'object') {
    if (vertex.sources.length > 1) {
      multipleSources = tools.listFileSources(vertex);
      vertex.sources.pop();
      throw vertex.MultipleSourceError(multipleSources);
    }
    previous = vertex.value;
    vertex.value = value;
    path = vertex.route.slice(source.route.length);
    if (!loading && !overlap) {
      change.patch.push(patch = {
        op: op,
        path: path.length == 0 ? '' : '/' + path.join('/'),
        value: vertex.value
      });
      if (op === 'replace' && this.tree._opts.patch.previous) {
        patch.previous = previous;
      }
    }
    return;
  }



  var nextTref = tref[key];
  for (var key in value) {
    this.loadKey(loading, source, nextVref, nextTref, key, value[key], change, overlap);
  }

  // console.log(vertex.route, 'key:', key, 'loading:', loading, 'overlap:', overlap);

  if (!loading) {
    if (!overlap) {
      path = vertex.route.slice(source.route.length);
      change.patch.push(patch = {
        op: op,
        path: path.length == 0 ? '' : '/' + path.join('/'),
        value: vertex.value
      });
      if (op === 'replace' && this.tree._opts.patch.previous) {
        patch.previous = previous;
      }
    }
  }
}

// TODO: possible alternative strategy for update: remove and add again, rebiulding vrefs
//       and then merging the 'remove'/'add' patch entries into 'replace'es

Vertex.prototype.updateSource = function(source, change) {
  var previous, patch, vref, tref;
  var value = source.serializer.readSync(source);  // throws on problem reading

  if (typeof value !== 'object') { // TODO: move into recursed updateKey()
    if (source.filename !== this.sources[0].filename) {
      this.tree._emitter.emit('$error', this.MultipleSourceError([source, this.sources[0]]));
      return;
    }
    if (value === this.value) return;

    // TODO: handle if value is not object but tref was

    previous = this.value;
    this.value = value;
    change.patch.push(patch = {
      op: 'replace',
      path: '',
      value: this.value
    });
    if (this.tree._opts.patch.previous) {
      patch.previous = previous;
    }
    return;
  }

  vref = this.vref;
  tref = this.value;
  for (var key in value) {
    try {
      this.updateKey(source, vref, tref, key, value[key], change);
    } catch (e) {
      console.log(e.stack); // TODO: remove
    }
  }

  // Find keys that were defined in the updated source, but are not there anymore
  // - Finds keys that were ""only"" defined because they are eligable for delete
  // - Other keys may be additionally defined by directory vertices (overlap)
  // - Also important to remove the defining source from the vertex if the source
  //   no longer defines the source
  tools.getKeysWithOnlyThisSource(this, source).forEach(function(key) {
    if (typeof value[key] !== 'undefined') return;
    vref[key].__.delete(source, change);
  });

  // Looks for nested keys that were defined in the updated source
  tools.getKeysWithThisAndOtherSources(this, source).forEach(function(key) {
    if (typeof value[key] !== 'undefined') return;
    var deletes = tools.getNestedVerticesWithOnlyThisSource(vref[key].__, source);
    if (deletes.length === 0) return;
    deletes.reverse().forEach(function(vertex) {
      vertex.delete(source, change);
    });
    // remove source where defined among others 
    deletes.others.forEach(function(vertex) {
      tools.conditionalDelete(vertex.sources, function(vertexSource) {
        return vertexSource.filePath == source.filePath;
      });
    });
  });

  tools.collapePatch(change);
}

Vertex.prototype.updateKey = function(source, vref, tref, key, value, change) {
  var previous, patch, nextVref, nextTref, vertex, path;

  nextVref = tools.getNested([key], vref);

  // new keys, recuse loadKey instead of updateKey
  if (typeof nextVref === 'undefined') {
    return this.loadKey(false, source, vref, tref, key, value, change, false, 'add');
  }

  nextTref = tref[key];
  vertex = nextVref.__;

  if (typeof value !== 'object') { // TODO: if key was defined in different source??
    if (source.filename !== vertex.sources[0].filename) {
      this.tree._emitter.emit('$error', vertex.MultipleSourceError([source, vertex.sources[0]]));
      return;
    }
    if (value === vertex.value) return;

    // TODO: handle if value is not object but tref was

    path = vertex.route.slice(source.route.length);
    previous = vertex.value;
    vertex.value = value;
    change.patch.push(patch = {
      op: 'replace',
      path: '/' + path.join('/'),
      value: vertex.value
    });
    if (this.tree._opts.patch.previous) {
      patch.previous = previous;
    }
    return;
  }

  // value was native type becomes object
  if (typeof nextTref !== 'object') {
    // nextVref.__.value = {};
    // nextVref.__.agent.previousKeys = [];
    return this.loadKey(false, source, vref, tref, key, value, change, false, 'replace');
  }

  nextTref = tref[key];
  for (var key in value) {
    this.updateKey(source, nextVref, nextTref, key, value[key], change);
  }

  tools.getKeysWithOnlyThisSource(vertex, source).forEach(function(key) {
    if (typeof value[key] !== 'undefined') return;
    nextVref[key].__.delete(source, change);
  });

  tools.getKeysWithThisAndOtherSources(vertex, source).forEach(function(key) {
    if (typeof value[key] !== 'undefined') return;
    var deletes = tools.getNestedVerticesWithOnlyThisSource(vertex.vref[key].__, source);
    if (deletes.length === 0) return;
    deletes.reverse().forEach(function(vertex) {
      vertex.delete(source, change);
    });
    deletes.others.forEach(function(vertex) {
      tools.conditionalDelete(vertex.sources, function(vertexSource) {
        return vertexSource.filePath == source.filePath;
      });
    });
  });
}

Vertex.prototype.delete = function(source, change) {
  var patch;
  var parent = this.parent;
  var value = this.value;
  var path = this.route.slice(source.route.length);

  this.recurseVrefDelete(parent.vref[this.key]);
  delete parent.vref[this.key];
  delete parent.value[this.key];

  tools.conditionalDelete(this.sources, function(src) {
    return src.filePath == source.filePath;
  });

  change.patch.push(patch = {
    op: 'remove',
    path: path.length == 0 ? '' : '/' + path.join('/'),
  });
  if (this.tree._opts.patch.previous) {
    patch.previous = value;
  }
}

Vertex.prototype.unloadSource = function(source, change) {
  if (!this.parent) return;
  var deletedTref = this.parent.value[this.key];
  var deletedVref = this.parent.vref[this.key];
  return this.recurseSourceDelete(deletedVref, deletedTref, source, change);
}

Vertex.prototype.recurseVrefDelete = function(vref, change) {
  for (var key in vref) {
    if (key == '__') {
      vref[key].deleted = true;
      continue;
    }
    this.recurseVrefDelete(vref[key]);
  }
}

Vertex.prototype.recurseSourceDelete = function(vref, tref, source, change) {
  var nextVref, nextTref;
  var vertex = vref.__;
  var path, patch;
  if (vertex.sources.length == 1 && vertex.sources[0].filename == source.filename) {
    path = vertex.route.slice(source.route.length);
    change.patch.push(patch = {
      op: 'remove',
      path: path.length == 0 ? '' : '/' + path.join('/'),
    });
    if (this.tree._opts.patch.previous) {
      patch.previous = tref;
    }
    // delete if it's the same and only source
    delete vertex.parent.value[vertex.key];
    delete vertex.parent.vref[vertex.key];
    // delete vertex.tree;
    // delete vertex.vref;
    this.recurseVrefDelete(vref, change);
    return;
  }

  // remove deleted source from vertex's list of sources

  tools.conditionalDelete(vertex.sources, function(vertexSource) {
    return vertexSource.filePath == source.filePath;
  });
  
  for (var key in vref) {
    if (key == '__') continue;
    nextVref = vref[key];
    nextTref = tref[key];
    this.recurseSourceDelete(nextVref, nextTref, source, change);
  }
  return;
}

