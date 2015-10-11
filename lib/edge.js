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

function Edge(left, right) {

  this.left = left;
  this.right = right;
  this.name = right._info.keys[right._info.keys.length - 1];
  // this.tapped = false;

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

  var treePointer = this.left._pointer;

  var target = this.right._pointer;

  var type = typeof treePointer[this.name];

  var _this = this;

  if (type !== 'undefined') {

    if (type !== 'object') {

      throw new Error(
        'cannot create edge on non-object at ', this.right._info.keys.join('/')
      )

    }

    // try {

    //   // Tap detector onto existing branch

    //   var existingBranch = treePointer[this.name];

    //   Object.defineProperty(treePointer, this.name, {
    //     enumerable: true,
    //     configurable: true,
    //     get: function() {
    //       console.log('get at tapped edge', _this.right._info.keys);
    //       return existingBranch;
    //     },
    //     set: function(v) {
    //       console.log('SET not yet supported! [C]');
    //     }
    //   });

    // } catch (e) {

    //   // Leave existing detector in tact

    // }

    //
    // will overwrite Vertex detectors on _content
    // (might not actually need edge detectors)

    return;

  }

  // Add detector at leaf (starts new branch)

  Object.defineProperty(treePointer, this.name, {
    enumerable: true,
    configurable: true,
    get: function() {
      console.log('get at untapped edge', _this.right._info.keys);
      return target;
    },
    set: function(v) {
      console.log('SET not yet supported! [B]');
    }
  });

}

