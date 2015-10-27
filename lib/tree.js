
// TODO: provide on('error', for when serialize fails to write, and writer is agent, excptions dont climb through userland



module.exports = Tree;

require('./extends/array');

var debugs = require('./debugs')('ntree:tree',['new', '_assemble', '_activate'])
  , path = require('path')
  // , util = require('util')
  , Promise = require('bluebird')
  , once = require('once')
  , Vertex = require('./vertex')
  , Edge = require('./edge')
  , Javascript = require('./serializers/javascript')
  , Directory = require('./serializers/directory')
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

  Object.defineProperty(this, '_edges', {
    value: []
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
  this.registerSerializer(new Directory());

  // Same properties as Vertex, for root edge.

  Object.defineProperty(this, '_pointer', {
    value: {}
  });

  Object.defineProperty(this, '_tree', {
    value: this
  });

  var edges = this._edges;

  Object.defineProperty(this, '_info', {
    value: {
      route: [],
    }
  });

  // Confine serialization walk to only specific vertex

  Object.defineProperty(this, '_confine', {
    writable: true,
    value: false
  });

  debugs.new('%j', this._meta);

}

Tree.prototype.created = Vertex.prototype.created;


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

  return tree._assemble()

  .then(function() {

    return tree._activate();

  })

  .then(function(tree) {

    callback(null, tree);

  })

  .catch(callback);

});



/**
 * ### ._assemble(callback)
 *
 * Assemble the tree.
 *
 * Walks the disk from the mount directory and load supported
 * files into the tree.
 *
 * Supported files per ./serializers/*
 *
 * @api private
 * @param {Function} [callback]
 * @returns {Promise}
 *
 */

Tree.prototype._assemble = Promise.promisify(function(callback) {

  var meta = this._meta;

  if (meta.started) {

    debugs._assemble('already started tree at \'%s\'', this._meta.mount);
    return callback(null, this);
  }

  debugs._assemble('starting tree at \'%s\'', this._meta.mount);


  // // var pointer = {}

  // var pointer = new Vertex(this, {name: '_pointer', route: []});

  var local = new Vertex(this, {
    name: '_local',
    route: [],
    fullname: this._meta.mount
  });

  var root = new Edge(this, '_local', local);

  this._edges['_local'] = root;

  local.init(callback);


});


/**
 * ### ._activate(callback)
 *
 * Activate the tree.
 *
 * Start watching for changes on disk and in tree.
 *
 * @api private
 * @param {Function} [callback]
 * @returns {Promise}
 *
 */

Tree.prototype._activate = Promise.promisify(function(callback) {

  debugs._activate('');

  var recurse = function(edges) {
    for (var name in edges) {
      edges[name].activate(/* tree */);
      if (edges[name].right) {
        recurse(edges[name].right._agents);
        recurse(edges[name].right._edges);
      }
    }
  }

  recurse(this._edges);

  this._meta.started = true;

  return callback(null, this);

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

