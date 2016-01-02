module.exports = Agent;

var debugs = require('./debugs')('ntree:agent', ['new', 'setSync', 'activate', 'onCreatedKey', 'onUpdatedKey', 'onDestroyedKey']);
var newDebug = debugs.new;
var setSync = debugs.setSync;
var activate = debugs.activate;
var onCreatedKey = debugs.onCreatedKey;
var onUpdatedKey = debugs.onUpdatedKey;
var onDestroyedKey = debugs.onDestroyedKey;


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
  this.route = route;
  this.routeString = route.join('/');
  this.vertex = vertex;

  // TODO: type, per vertex type (dir, file)

  newDebug('(%s) at route: %j', locus, route);

  Object.defineProperty(this, 'logger', {
    value: vertex._tree._tools.logger
  });

  var _this = this;

  var type = typeof value[locus];

  if (type == 'string' || type == 'number' || type == 'boolean' || type == 'function') {

    this.value = value[locus];

  } else {

    this.value = {};
    
  }

  try {

    Object.defineProperty(object, locus, {

      configurable: true, //false,

      enumerable: true,

      get: function() {
        return _this.getSync();
      },

      set: function(v) {
        _this.setSync(locus, v);
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

  if (this.vertex._exclude) return undefined;

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

Agent.prototype.setSync = function(key, value) {

  setSync('(%s) path: \'%s\'', this.name, this.routeString);

  var oldValue = this.value;

  this.value = value;

  this.onUpdatedKey(key, oldValue, value);

}


/**
 * ### .activate()
 *
 * Activate this Agent
 *
 * * Checks for keys created and destroyed on this.value
 *
 * @api private
 *
 */

Agent.prototype.activate = function(/* tree */) {

  if (this.interval) return;

  var value = this.getSync();

  if (typeof value !== 'object') return;

  activate('starting as %s at \'%s\'', this.constructor.name, this.routeString);

  var knownKeys = {};

  Object.keys(value).forEach(function(key) {

    knownKeys[key] = {
      value: value[key]
    };

  });

  var _this = this;

  var interval = this.vertex._tree._meta.scanInterval || 20;

  this.interval = setInterval(function() {

    var value = _this.getSync();

    if (typeof value !== 'object') return; // TODO: it may have just been deleted...
                                          //        clean up?

    Object.keys(value).forEach(function(key) {

      if (knownKeys[key]) return;
      knownKeys[key] = {
        value: value[key]
      };
      _this.onCreatedKey(key);

    });

    Object.keys(knownKeys).forEach(function(key) {

      // TODO: remove agent/edge intervals for deleted content (subtree)

      if (typeof value[key] !== 'undefined') return;
      var oldValue = knownKeys[key].value;
      delete knownKeys[key];
      _this.onDestroyedKey(key, oldValue);

    });

  }, interval);

}


/**
 * ### .onCreatedKey(key)
 * 
 * Called when a new property is appended at this Agents value
 *
 * @api private
 * @param {String} key
 *
 */

Agent.prototype.onCreatedKey = function(key) {

  if (!this.vertex._tree._meta.started) return;

  if (this.ignoreCreate) return;

  onCreatedKey('(%s) created: \'%s\', path: \'%s\'', this.name, key, this.routeString);

  return this.vertex.onCreatedKey(key, this);

}


/**
 * ### .onUpdatedKey(key)
 *
 * Called then this Agents value is modified
 *
 * @api private
 * @param {String} key
 * @param {Object} oldValue
 * @param {Object} newValue
 *
 */
Agent.prototype.onUpdatedKey = function(key, oldValue, newValue) {

  if (!this.vertex._tree._meta.started) return;

  onUpdatedKey('(%s) created: \'%s\', path: \'%s\'', this.name, key, this.routeString);

  this.vertex._confine = true;

  try {
    this.vertex.onUpdatedKey(key, this, oldValue, newValue);
  } catch(e) {
    this.logger.warn('agent.onUpdatedKey() error', e);
  }

  this.vertex._confine = false;

}


/**
 * ### .onDestroyedKey(key)
 * 
 * Called when a property is deleteded from this Agents value
 *
 * @api private
 * @param {String} key
 * @param {Object} oldValue
 *
 */

Agent.prototype.onDestroyedKey = function(key, oldValue) {


  onDestroyedKey('(%s) destroyed: \'%s\', path: \'%s\'', this.name, key, this.routeString);

  this.vertex._confine = true;

  try {
    this.vertex.onDestroyedKey(key, this, oldValue);
  } catch(e) {
    this.logger.warn('agent.onDestroyedKey() error', e);
  }

  this.vertex._confine = false;

}

