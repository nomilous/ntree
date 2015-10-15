module.exports = Edge;

var debugs = require('./debugs')('ntree:edge', ['new', 'link']);

/**
 * ## class Edge()
 *
 * Instance of a connection between two vertices.
 *
 * @api public
 * @constructor
 * @param {Vertex} vertex1
 * @param {String} name
 *
 */

function Edge(vertex1, name) {

  this.vertex1 = vertex1;
  this.name = name;
  this.vertex2; // assigned with edge.link(vertex)

  this.routeString = this.vertex1._info.route.join('/') + '/' + name;

  var debug = debugs.new;

  debug('(%s) vertex1: \'%s\'', name, this.vertex1._info.name);

  var _this = this;

  var pointer = vertex1._pointer;

  try {

    Object.defineProperty(pointer, name, {

      enumerable: true,
      configurable: true,

      get: function() {
        // if (typeof _this.vertex2 == 'undefined') {
        //   throw new Error('edge not linked');
        // }
        debug('(%s) get() path: %s', name, _this.routeString);
        try {
          return _this.vertex2._pointer;
        } catch (e) {
          debug('(%s) get() at unlinked', name);
            return undefined;
        }
      },

      set: function(v) {
        if (typeof _this.vertex2 == 'undefined') {
          throw new Error('edge not linked');
        }
        debug('(%s) set() not defined at path: \'%s\'', name, _this.routeString);
      }

    });

  } catch(e) {

    // It's ok to have failed to create the edge propery. It means the property already
    // exists and was created by a file vertex.

  }

}

/**
 * ### .link(vertex)
 * 
 * Links the vertices on either side of this edge
 *
 * @api public
 * @param {Vertex} vertex
 *
 */

Edge.prototype.link = function(vertex) {
  debugs.link('(%s) link vertex \'%s\'', this.name, vertex._info.name);
  this.vertex2 = vertex;
}

// /**
//  * ### .init()
//  *
//  * Performs the join assembly
//  *
//  * @api public
//  *
//  */

// Edge.prototype.init = function() {

//   var debug = debugs.init;

//   var treePointer = this.left._pointer;

//   var type = typeof treePointer[this.name];

//   var target = this.right;

//   var targetType = typeof target._pointer;

//   var _this = this;

//   if (type !== 'undefined') {

//     if (type !== 'object') {

//       if (type == targetType) {

//         if (treePointer[this.name] != target._pointer) {

//           var e = new Error('conflicting value at route ' + this.right._info.route.join('/'));

//           e.info = {
//             source1: this.left._info.fullname,
//             source2: this.right._info.fullname,
//           }

//           throw e

//         }

//       }

//       else {

//         throw new Error(
//           'cannot create edge on non-object at ' + this.right._info.route.join('/')
//         );

//       }

//     }

//     return this;

//   }

//   debug('(%s) create detector', this.name);

//   Object.defineProperty(treePointer, this.name, {
//     enumerable: true,
//     configurable: true,
//     get: function() {
//       debug('(%s) get() route: %j', _this.name, _this.right._info.route);
//       return target._pointer;
//     },
//     set: function(v) {
//       debug('set not yet implemented at route: %j', _this.right._info.route);
//     }
//   });

//   return this;

// }

