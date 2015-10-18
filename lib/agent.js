module.exports = Agent;

var debugs = require('./debugs')('ntree:agent', ['new', 'getSync', 'setSync', 'watch', 'created', 'destroyed']);
var newDebug = debugs.new;
var getSync = debugs.getSync;
var setSync = debugs.setSync;
var watchDebug = debugs.watch;
var created = debugs.created;
var destroyed = debugs.destroyed;


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

  this.name = locus;
  this.routeString = route.join('/');
  this.vertex = vertex;

  // TODO: type, per vertex type (dir, file)

  newDebug('(%s) at route: %j', locus, route);

  Object.defineProperty(this, 'logger', {
    value: this.logger = vertex._tree._tools.logger
  });

  var _this = this;

  var type = typeof value[locus];

  if (type == 'string' || type == 'number' || type == 'boolean') {

    this.value = value[locus];

  } else {

    this.value = {};
    this.watch();

  }

  try {

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

    this.logger.warn('could not create property \'%s\'', this.routeString, e);

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

  // Runs a lot, esp with watch(),  getSync('(%s) path: \'%s\'', this.name, this.routeString);

  return this.value;

}


/**
 * ### .setSync(value)
 * 
 * Set the value controlled by this agent
 *
 * @api private
 *
 */

Agent.prototype.setSync = function(value) {

  setSync('(%s) path: \'%s\'', this.name, this.routeString);

  this.value = value;

}


/**
 * ### .watch()
 *
 * Intarval loop checks for keys created and destroyed  
 *
 * @api private
 *
 */

Agent.prototype.watch = function() {

  if (this.interval) return;

  watchDebug('starting as %s', this.constructor.name);

  var _this = this;

  var interval = this.vertex._tree._meta.scanInterval || 20;

  var value = _this.getSync();

  var knownKeys;

  if (typeof value == 'object') {

    knownKeys = {};

    Object.keys(_this.getSync()).forEach(function(key) {

      knownKeys[key] = 1;

    });

  }

  this.interval = setInterval(function() {

    var value = _this.getSync();

    if (typeof value !== 'object') return; // TODO: it may have just been deleted...
                                          //        clean up?

    if (!knownKeys) {

      knownKeys = {};

      Object.keys(_this.getSync()).forEach(function(key) {

        knownKeys[key] = 1;

      });

    }

    Object.keys(value).forEach(function(key) {

      if (knownKeys[key]) return;

      knownKeys[key] = 1;
      _this.created(key);

    });

    Object.keys(knownKeys).forEach(function(key) {

      if (typeof value[key] !== 'undefined') return;

      delete knownKeys[key];
      _this.destroyed(key);

    });

  }, interval);

}


/**
 * ### .created()
 * 
 * Called when a new property is appended at this Agents value
 *
 * @api private
 *
 */

Agent.prototype.created = function(key) {

  created('(%s) created: \'%s\', path: \'%s\'', this.name, key, this.routeString);

}


/**
 * ### .destroyed()
 * 
 * Called when a new property is appended at this Agents value
 *
 * @api private
 *
 */

Agent.prototype.destroyed = function(key) {

  destroyed('(%s) destroyed: \'%s\', path: \'%s\'', this.name, key, this.routeString);

}

