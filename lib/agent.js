module.exports = Agent;

var debugs = require('./debugs')('ntree:agent', ['getSync', 'setSync']);
var getSync = debugs.getSync;
var setSync = debugs.setSync;

/**
 * ## class Agent()
 *
 * Instance of a property agent.
 *
 * Creates value on object at locus. 
 *
 * If value is an object it creates a standin property and monitors
 * it for key additions and removals.
 *
 * If value is a native type it creates the property and monitors it
 * for changes.
 *
 * @api private
 * @constructor
 * @param {Vertex} vertex
 * @param {String} locus
 * @param {Object} object
 * @param {Object|String|Number|Boolean} value
 * @param {Array} route
 *
 */

function Agent(vertex, locus, object, value, route) {

  this.routeString = route.join('/');
  this.name = locus;

  var type = typeof value[locus];

  if (type == 'string' || type == 'number' || type == 'boolean') {
    this.value = value[locus];
  } else {
    this.value = {};
  }

  try {

    var _this = this;

    Object.defineProperty(object, locus, {

      configurable: false,

      enumerable: true,

      get: function() {
        return _this.getSync();
      },

      set: function(v) {
        _this.setSync(v);
      }

    });

  } catch (e) {

    console.log(1, this._info.shared, e);

    debug('not owner at  path: \'%s\'', routeString, e);

  }

}


/**
 * ### .getSync()
 *
 * Return the value controlled by this agent
 *
 * @api private
 *
 */

Agent.prototype.getSync = function() {

  getSync('(%s) path: \'%s\'', this.name, this.routeString);

  return this.value;

}


/**
 * ### .setSync(value)
 * 
 * Sets the value controlled by this agent
 *
 * @api private
 *
 */

Agent.prototype.setSync = function(value) {

  setSync('(%s) path: \'%s\'', this.name, this.routeString);

  this.value = value;

}

