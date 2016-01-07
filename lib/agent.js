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
    if (change.removed) {
      debug('scan found removed %j', change.removed);
    }
    if (change.added) {
      debug('scan found added %j', change.added);
    }
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
