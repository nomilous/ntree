module.exports = Vertex;

function Vertex(tree, source, vref) {

  Object.defineProperty(this, 'tree', {
    enumerable: false,
    configurable: false,
    value: tree
  });

  Object.defineProperty(this, 'source', {
    enumerable: false,
    configurable: false,
    value: source
  });

  Object.defineProperty(this, 'vref', {
    enumerable: false,
    configurable: false,
    value: vref
  });

}

Vertex.prototype.getValue = function() {
  return {};
}

Vertex.prototype.setValue = function() {
  
}
