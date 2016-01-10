module.exports = Agent;

var debug = require('debug')('ntree:Agent');
var Promise = require('bluebird');
var Tools = require('./tools'), tools = new Tools();

function Agent(vertex) {
  this.vertex = vertex;
  this.opts = vertex.tree._opts.agents || {};
}

Agent.prototype.scan = function(token) {
  var agent = this;
  var change;

  token.vertices++;
  if (typeof agent.vertex.value !== 'object') return Promise.resolve();
  
  var keys = Object.keys(agent.vertex.value);
  if (typeof agent.previousKeys === 'undefined') {
    agent.previousKeys = keys;
  } else {
    change = tools.diffKeys(agent.previousKeys, keys);
    if (change.removed || change.added) this.onChanged(change);
  }
  agent.previousKeys = keys;

  // call oward to all nested agents
  
  return Promise.map(keys, function(key) {
    try {
      return agent.vertex.vref[key].__.agent.scan(token);
    } catch (e) {
      'ignore'
    }
  });
}

Agent.prototype.onChanged = function(change) {
  debug('change in key: %s, added: %j, removed: %j',
    this.vertex.key, change.added, change.removed
  );
  this.vertex.onChanged(change);
}
