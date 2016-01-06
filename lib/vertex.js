module.exports = Vertex;

var extending = require('./extends/array');
var SourceType = require('./constants/source_type');
var Agent = require('./agent');

function Vertex(tree, source, vref) {

  Object.defineProperty(this, 'tree', {
    enumerable: false,
    configurable: false,
    value: tree
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
    value: null
  });

  var parent;
  Object.defineProperty(this, 'parent', {
    enumareble: false,
    configurable: false,
    get: function() {
      if (parent) return parent;
      try {
        var route = this.sources.last.route;
        route = route.slice(0, route.length - 1);
        var vref = this.tree._tools.getNested(route, tree._vertices);
        return parent = vref.__;
      } catch (e) {
        return undefined;
      }
    }
  });

  Object.defineProperty(this, 'deleted', {
    enumareble: false,
    configurable: false,
    writable: true,
    value: false,
  });

  this.value = {};

}

Vertex.prototype.getValue = function() {
  // TODO: if deleted
  return this.value;
}

Vertex.prototype.setValue = function(value) {
  // TODO: if deleted...
  console.log('SET', this.deleted, value);
}

Vertex.prototype.loadSource = function(loading) {
  var source = this.sources.last;
  var tools = this.tree._tools;
  var value = source.serializer.readSync(this);

  // if (loading) {
  //   var opts = {
  //     interval: this.tree._opts.sourceInterval
  //   }
  //   this.agents.sources.push(new FileAgent(source.filename, opts));
  // }

  var vref = this.vref; // vertex reference tree
  var tref = this.value; // user tree

  if (typeof value !== 'object') {
    this.value = value;
    return;
  }

  for (var key in value) {
    this.loadKey(loading, source, tools, vref, tref, key, value[key]);
  }
}

Vertex.prototype.unloadSource = function(source) {
  var parent, thiskey, deletedTref, deletedVref;

  // full delete if source is the only source for this vertex
  if (this.sources.length == 1) {

    thiskey = source.route.last;
    parent = this.parent;

    if (!parent) return;

    deletedTref = parent.value[thiskey];
    deletedVref = parent.vref[thiskey];

    delete parent.value[thiskey];
    delete parent.vref[thiskey];

    deletedVref.__.deleted = true;

    return this.recurseDeletedVref(deletedVref);
  }
}

Vertex.prototype.recurseDeletedVref = function(vref) {
  for (var key in vref) {
    if (key == '__') {
      vref[key].deleted = true;
      continue;
    }
    this.recurseDeletedVref(vref[key]);
  }
}



Vertex.prototype.loadKey = function(loading, source, tools, vref, tref, key, value) {

  var vertex;
  var nextVref = tools.getNested([key], vref);

  if (typeof nextVref === 'undefined') {
    nextVref = {};
    nextVref.__ = vertex = new Vertex(this.tree, source, nextVref);
    tools.setNested([key], vref, nextVref);
    tools.setPropertyNested([key], tref, vertex);
  } else {
    vertex = nextVref.__;
    vertex.sources.push(source);
  }

  if (typeof value !== 'object') {
    vertex.value = value;
    return;
  }

  var nextTref = tref[key];
  for (var key in value) {
    this.loadKey(loading, source, tools, nextVref, nextTref, key, value[key]);
  }

}
