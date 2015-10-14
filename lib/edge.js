module.exports = Edge;

var debugs = require('./debugs')('ntree:edge', ['new', 'init']);

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

function Edge(left, right) {

  this.left = left;
  this.right = right;
  this.name = right._info.route[right._info.route.length - 1];
  // this.tapped = false;

  debugs.new(
    '(%s) left: \'%s\', right: \'%s\'',
    this.name,
    this.left._info.name,
    this.right._info.name
  );

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

  var debug = debugs.init;

  var treePointer = this.left._pointer;

  var type = typeof treePointer[this.name];

  var target = this.right;

  var targetType = typeof target._pointer;

  var _this = this;

  if (type !== 'undefined') {

    if (type !== 'object') {

      if (type == targetType) {

        if (treePointer[this.name] != target._pointer) {

          var e = new Error('conflicting value at route ' + this.right._info.route.join('/'));

          e.info = {
            source1: this.left._info.fullname,
            source2: this.right._info.fullname,
          }

          throw e

        }

      }

      else {

        throw new Error(
          'cannot create edge on non-object at ' + this.right._info.route.join('/')
        );

      }

    }

    return this;

  }

  debug('(%s) create detector', this.name);

  Object.defineProperty(treePointer, this.name, {
    enumerable: true,
    configurable: true,
    get: function() {
      debug('(%s) get() route: %j', _this.name, _this.right._info.route);
      return target._pointer;
    },
    set: function(v) {
      debug('set not yet implemented at route: %j', _this.right._info.route);
    }
  });

  return this;

}

