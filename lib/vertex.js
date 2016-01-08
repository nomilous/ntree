module.exports = Vertex;

var extending = require('./extends/array');
var SourceType = require('./constants/source_type');
var Agent = require('./agent');
var Tools = require('./tools'), tools = new Tools();

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
      if (this.key) route.unshift(this.key);
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
  return this.value;
}

Vertex.prototype.setValue = function(value) {
  // TODO: if deleted...
  console.log('SET', this.deleted, value);
}

Vertex.prototype.loadSource = function(loading, change, overlap) {
  var source = this.sources.last;
  var value = source.serializer.readSync(this);
  var vref = this.vref; // vertex reference tree
  var tref = this.value; // user tree

  if (typeof value !== 'object') { // TODO: native types, support array
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


Vertex.prototype.loadKey = function(loading, source, vref, tref, key, value, change, parentOverlap) {
  var vertex;
  var nextVref = tools.getNested([key], vref);
  var overlap;
  var path;

  if (typeof nextVref === 'undefined') {
    overlap = false;
    nextVref = {};
    nextVref.__ = vertex = new Vertex(this.tree, key, source, nextVref, vref.__);
    tools.setNested([key], vref, nextVref);
    tools.setPropertyNested([key], tref, vertex);
    if (!loading && parentOverlap) {
      // new branch's root key, add to known keys so that
      // agent does not find dif leading to outSync as if
      // addition originated in tree.
      vref.__.agent.previousKeys.push(vertex.key);
    }
  } else {
    overlap = true;
    vertex = nextVref.__;
    vertex.sources.push(source);
  }

  if (typeof value !== 'object') {
    vertex.value = value;
    return;
  }

  var nextTref = tref[key];
  for (var key in value) {
    this.loadKey(loading, source, nextVref, nextTref, key, value[key], change, overlap);
  }

  if (!loading) {
    if (!overlap) {
      path = vertex.route.slice(source.route.length);
      change.patch.push({
        op: 'add',
        path: path.length == 0 ? '' : '/' + path.join('/'),
        value: vertex.value
      });
    }
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
  var path;
  if (vertex.sources.length == 1 && vertex.sources[0].filename == source.filename) {
    path = vertex.route.slice(source.route.length);
    change.patch.push({
      op: 'remove',
      path: path.length == 0 ? '' : '/' + path.join('/'),
      value: tref
    });
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

