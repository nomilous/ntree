module.exports = Vertex;

/**
 * ## class Vertex()
 *
 * Creates a Vertex instance which:
 * 
 * * Is attached to the tree at the specified `info.keys` path.
 * * Houses the content of the data fragment at `info.fullname` (filname).
 * * 
 *
 * @api public
 * @constructor
 * @param {Tree} tree
 * @param {{keys: Array, fullname: String}} info
 *
 */

function Vertex(tree, info) {

  Object.defineProperty(this, '_info', {
    value: info
  });

  Object.defineProperty(this, '_tree', {
    value: tree
  });

}


/**
 * 
 * ## .init(callback)
 *
 * Initializes the Vertex instance
 *
 * @api public
 * @param {Function} [callback]
 *
 */

Vertex.prototype.init = function(callback) {

  callback(null, this);

}
