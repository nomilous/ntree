var Promise = require('bluebird');
var path = require('path');
var util = require('util');
var Vertex = require('./vertex');

module.exports = Tree;


/**
 * ## class Tree()
 *
 * Creates a Tree instance which:
 * 
 * * Attaches to data (filesystem) at `config.mount` directory. 
 * * Scans for new data fragments (.js files) every `config.scanInterval` milliseconds.
 * * Watches for changes to existing data fragments every `config.watchInterval` seconds.
 *
 * @api public
 * @constructor
 * @param {{mount: String, scanInteval: Number, watchInterval: Number}} config
 *
 */

function Tree(config) {

  config = config || {};

  config.mount = config.mount || process.cwd();
  config.mount = path.normalize(config.mount);
  config.mount = config.mount.replace(new RegExp(path.sep + '$'), '');

  config.scanInterval = config.scanInterval || 1000;
  config.watchInterval = config.watchInterval || 100;

  config.lazy = typeof config.lazy == 'boolean' ? config.lazy : false;

  Object.defineProperty(this, '_meta', {
    value: {
      mount: config.mount,
      scanInterval: config.scanInterval,
      watchInterval: config.watchInterval,
      lazy: config.lazy,
  //     regex: new RegExp('^' + config.mount + path.sep),
  //     shallow: config.mount + path.sep + '*.js',
  //     deep: config.mount + path.sep + '**' + path.sep + '*.js',
  //     interval: config.interval,
  //     files: {},
  //     nodes: {},
  //     // first: true,
    }
  });

}

util.inherits(Tree, Vertex);


/**
 * ### Tree.create(config, callback)
 *
 * Creates an Tree instance.
 *
 * @api public
 * @param {{mount: String, scanInteval: Number, watchInterval: Number}} [config]
 * @param {Function} [callback]
 * @returns {Promise}
 *
 */

Tree.create = Promise.promisify(function(config, callback) {

  if (typeof config === 'function') {
    callback = config;
    config = null;
  }

  var tree = new Tree(config);
  return tree.start(callback);

});



/**
 * ### .start(callback)
 *
 * Starts the Tree instance.
 *
 * @api public
 * @param {Function} [callback]
 * @returns {Promise}
 *
 */

Tree.prototype.start = Promise.promisify(function(callback) {

  // Perfom extend to make this Tree an instanceof Vertex

  Vertex.call(this, this, {
    keys: [], // is the root vertex
    fullname: this._meta.mount
  });

  this.loadAsync(callback);

  // if (!this._meta.lazy) return this.loadAsync(callback);

  // callback(this.loadSync(), this);

});
