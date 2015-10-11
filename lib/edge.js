module.exports = Edge;

/**
 * ## class Edge()
 *
 * Instance of a connection between two vertices.
 *
 * @api public
 * @constructor
 * @param {String} name
 * @param {Vertex} left
 * @param {Vertex} right
 *
 */

function Edge(name, left, right) {

  this.name = name;
  this.left = left;
  this.right = right;

}

/**
 * ### .init()
 *
 * Performs the join assembly
 *
 * @api public
 *
 */

Edge.prototype.init = function() {

}

