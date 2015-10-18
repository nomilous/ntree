module.exports = Tree;

var debugs = require('./debugs')('ntree:tree',['new', 'create', 'start'])
  , path = require('path')
  , util = require('util')
  , Promise = require('bluebird')
  , once = require('once')
  , Vertex = require('./vertex')
  , Javascript = require('./serializers/javascript')
  ;


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
 * @param {{mount: String, scanInteval: Number, logger: Logger}} config
 *
 */

function Tree(config) {

  config = config || {};

  config.mount = config.mount || process.cwd();
  config.mount = path.normalize(config.mount);
  config.mount = config.mount.replace(new RegExp(path.sep + '$'), '');

  config.scanInterval = config.scanInterval || 20;

  Object.defineProperty(this, '_meta', {
    value: {
      started: false,
      mount: config.mount,
      scanInterval: config.scanInterval,
    }
  });

  Object.defineProperty(this, '_tools', {
    value: {
      logger: config.logger || console
    }
  });

  Object.defineProperty(this, '_serializers', {
    value: {}
  });

  this.registerSerializer(new Javascript());

  debugs.new('%j', this._meta);

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

  debugs.create('%j', config);

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

  var meta = this._meta;

  if (meta.started) {

    debugs.start('already started tree at \'%s\'', this._meta.mount);
    return callback(null, this);
  }

  debugs.start('starting tree at \'%s\'', this._meta.mount);

  Vertex.call(this, this, {
    route: [],
    name: '__root',
    fullname: this._meta.mount
  });

  this.init(function(e, vertex) {
    console.log('\n\ncallback', meta.started);
    meta.started = true;
    callback(e, vertex);
  });

});


/**
 * ### .registerSerializer(serializer)
 *
 * Registers a serializer.
 *
 * @api public
 * @param {Serializer} serializer
 *
 */

Tree.prototype.registerSerializer = function(serializer) {

  var serializers = this._serializers;

  serializer.extensions.forEach(function(ext) {

    serializers[ext] = serializer;

  });

}

