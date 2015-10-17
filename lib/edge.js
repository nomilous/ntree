module.exports = Edge;

var path = require('path');
var debugs = require('./debugs')('ntree:edge', ['new', 'getSync', 'setSync']);

/**
 * ## class Edge()
 *
 * Instance of a connection between two vertices.
 *
 * @api public
 * @constructor
 * @param {Vertex} left
 * @param {String} name
 * @param {Vertex} right
 *
 */

function Edge(left, name, right) {

  this.name = name;
  this.left = left;
  this.right = right; // assigned with edge.link(vertex)
  this.routeString = this.routeToString();

  var debug = debugs.new;

  debug('(%s) left: \'%s\'', name, this.left._info.name);

  var _this = this;

  var pointer1 = left._pointer;

  var shared = right._info.shared;

  try {

    Object.defineProperty(pointer1, name, {

      enumerable: true,

      configurable: shared,

      get: function() {
        return _this.getSync();
      },

      set: function(v) {
        _this.setSync(v);
      }

    });

  } catch(e) {

    var type = right._info.stat.isDirectory() ? 'directory' : 'file';
    var relative = path.relative(process.cwd(), right._info.fullname);
    right.ignore = true;
    console.warn('WARN: \'%s\' %s ignored (path duplicate)', relative, type);

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
 * ### .getSync()
 *
 * Return the right vertex pointer
 *
 * @api private
 * 
 */

Edge.prototype.getSync = function() {

  getSync('(%s) path: \'%s\'', this.name, this.routeString);

  return this.right._pointer;

}

var getSync = debugs.getSync;


/**
 * ### .setSync()
 *
 * Set new value (branch) at right vertex pointer
 *
 * @api private
 * 
 */

Edge.prototype.setSync = function() {

  console.warn('WARN: cannot overwrite Edge at \'%s\'', this.routeString)

}

var setSync = debugs.setSync;


/**
 * ### .routeString()
 *
 * @api private
 * @returns {String}
 *
 */

Edge.prototype.routeToString = function() {

  return this.left._info.route.length == 0

    ? this.name

    : this.left._info.route.join('/') + '/' + this.name

}

