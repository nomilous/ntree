module.exports = Edge;

var path = require('path');
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

function Edge(vertex1, name, vertex2) {

  this.name = name;
  this.vertex1 = vertex1;
  this.vertex2 = vertex2; // assigned with edge.link(vertex)
  this.routeString = this.routeToString();

  var debug = debugs.new;

  debug('(%s) vertex1: \'%s\'', name, this.vertex1._info.name);

  var _this = this;

  var pointer1 = vertex1._pointer;

  var shared = vertex2._info.shared;

  try {

    Object.defineProperty(pointer1, name, {

      enumerable: true,

      configurable: shared,

      get: function() {
        // if (typeof _this.vertex2 == 'undefined') {
        //   throw new Error('edge not linked');
        // }
        debug('(%s) get() path: \'%s\'', name, _this.routeString, _this.vertex2);
        return vertex2._pointer;
        // try {
        //   return vertex2._pointer;
        // } catch (e) {
        //   debug('(%s) get() at unlinked', name);
        //     return undefined;
        // }
      },

      set: function(v) {
        // if (typeof _this.vertex2 == 'undefined') {
        //   throw new Error('edge not linked');
        // }
        debug('(%s) set() not defined at path: \'%s\'', name, _this.routeString);
      }

    });

  } catch(e) {

    var type = vertex2._info.stat.isDirectory() ? 'directory' : 'file';
    var relative = path.relative(process.cwd(), vertex2._info.fullname);
    console.warn('WARN: \'%s\' %s ignored (path duplicate)', relative, type);
    vertex2.ignore = true;

    // Supporting deep route duplication (path shadowing) between files and directories...
    //
    //    ie.
    //
    //      planets.js defines outer.neptune.name = 'Neptune'
    //      planets/outer/neptune/radius.js defines {Number}
    //
    //
    // ...may be a future possibility. (it's complicated)

  }

}

/**
 * ### .routeString()
 *
 * @returns {String}
 *
 */

Edge.prototype.routeToString = function() {
  
  return this.vertex1._info.route.length == 0

    ? this.name

    : this.vertex1._info.route.join('/') + '/' + this.name

}

