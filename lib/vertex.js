module.exports = Vertex;

var extending = require('./extends/array');
var SourceType = require('./constants/source_type');
var FileAgent = require('./agents/file_agent');

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

  Object.defineProperty(this, 'agents', {
    enumerable: false,
    configurable: false,
    value: {
      sources: [],  // monitor sources dir/file/both for changes
      tree: null,   // monitor tree for changes
    }
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

  this.value = {};

}

Vertex.prototype.getValue = function() {
  return this.value;
}

Vertex.prototype.setValue = function(value) {
  console.log('SET', value);
}

Vertex.prototype.loadSource = function(first) {
  var source = this.sources.last;
  var tools = this.tree._tools;
  var value = source.serializer.readSync(this);

  // if (first) {
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
    this.loadKey(first, source, tools, vref, tref, key, value[key]);
  }
}

Vertex.prototype.loadKey = function(first, source, tools, vref, tref, key, value) {

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
    this.loadKey(first, source, tools, nextVref, nextTref, key, value[key]);
  }

}
