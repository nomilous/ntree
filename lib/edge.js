module.exports = Edge;

var path = require('path');
var debugs = require('./debugs')('ntree:edge', ['new', 'getSync', 'setSync']);

var Agent = require('./agent');

/**
 * ## class Edge()
 *
 * Instance of a connection between two vertices.
 *
 * @api private
 * @constructor
 * @param {Vertex} left
 * @param {String} name
 * @param {Vertex} right
 *
 */

function Edge(left, name, right) {

  this.name = name;
  this.routeString = this.routeToString(left, name);
  this.left = left;
  this.right = right; // assigned with edge.link(vertex)

  Object.defineProperty(this, 'logger', {
    value: left._tree._tools.logger
  });

  Object.defineProperty(this, 'vertex', {
    value: left
  });

  Object.defineProperty(this, 'interval', {
    writable: true,
    value: undefined
  });

  var debug = debugs.new;

  debug('(%s) left: \'%s\', right: \'%s\'', name, this.left._info.name, this.right._info.name);

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

    console.log(e);

    var type = right._info.stat.isDirectory() ? 'directory' : 'file';
    var relative = path.relative(process.cwd(), right._info.fullname);
    right.ignore = true;
    this.logger.warn('ignored %s \'%s\' (path duplicate)', type, relative);

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

Edge.prototype.activate = Agent.prototype.activate;

Edge.prototype.created = Agent.prototype.created;

Edge.prototype.destroyed = Agent.prototype.destroyed;


/**
 * ### .getSync()
 *
 * Return the right vertex pointer
 *
 * @api private
 * 
 */

Edge.prototype.getSync = function() {

  // Too noisey, // getSync('(%s) path: \'%s\'', this.name, this.routeString);

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

  this.logger.warn('cannot overwrite Edge at \'%s\'', this.routeString)

}

var setSync = debugs.setSync;


/**
 * ### .routeString()
 *
 * @api private
 * @param {Vertex} vertex
 * @param {String} name
 * @returns {String}
 *
 */

Edge.prototype.routeToString = function(vertex, name) {

  return vertex._info.route.length == 0

    ? name

    : vertex._info.route.join('/') + '/' + name;

}



