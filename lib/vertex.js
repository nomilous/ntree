module.exports = Vertex;

var extending = require('./extends/array');
var SourceType = require('./constants/source_type');

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

  if (source.type === SourceType.DIRECTORY) {
    this.hasDirectory = true;
    this.value = {}
  }

  this.value = {};

}

Vertex.prototype.getValue = function() {
  return this.value;
}

Vertex.prototype.setValue = function() {
  
}

Vertex.prototype.loadSource = function(first) {
  var source = this.sources.last;
  var tools = this.tree._tools;
  var value = source.serializer.readSync(this);

  var vref = this.vref; // vertex reference tree
  var tref = this.value; // user tree

  if (typeof value !== 'object') {
    console.log('handle types, value');
    this.value = value;
    return;
  }

  for (var key in value) {
    this.loadKey(first, source, tools, vref, tref, key, value[key]);
  }
}

Vertex.prototype.loadKey = function(first, source, tools, vref, tref, key, value) {

  var vertex;

  // console.log('key', key);
  // console.log('vref', vref);
  // console.log('value', value);

  var nextVref = tools.getNested([key], vref);
  if (typeof nextVref === 'undefined') {
    nextVref = {};
    nextVref.__ = vertex = new Vertex(this.tree, source, nextVref);
    tools.setNested([key], vref, nextVref);
    tools.setPropertyNested([key], tref, vertex);
  } else {
    vertex = vref.__;
    vertex.sources.push(source);
  }

  if (typeof value !== 'object') {
    vertex.value = value;
    console.log('handle types, value');
    return;
  }

  var nextTref = tref[key];
  for (var key in value) {
    this.loadKey(first, source, tools, nextVref, nextTref, key, value[key]);
  }

}
