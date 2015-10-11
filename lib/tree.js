var Promise = require('bluebird');
var path = require('path');
// var Node = require('./node');


module.exports = Tree;


/**
 * ## class Tree()
 *
 * Creates an nTree instance which:
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

  config.scanInterval = config.scanInterval || 1000;
  config.watchInterval = config.watchInterval || 100;
  config.mount = config.mount || process.cwd();
  config.mount = path.normalize(config.mount);
  config.mount = config.mount.replace(new RegExp(path.sep + '$'), '');

  Object.defineProperty(this, '_meta', {
    value: {
      mount: config.mount,
      scanInterval: config.scanInterval,
      watchInterval: config.watchInterval,
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


/**
 * ### Tree.create(config, callback)
 *
 * Creates an nTree instance. Callback or Promise.
 *
 * @api public
 * @param {{mount: String, scanInteval: Number, watchInterval: Number}} [config]
 * @param {Function} [callback]
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
 * Starts the nTree instance. Callback or Promise.
 *
 * @api public
 * @param {Function} [callback]
 *
 */

Tree.prototype.start = Promise.promisify(function(callback) {

  console.log('xx');

  callback(null, this);

  // var _this = this;

  // var running = false;

  // var refresh = $$in({_meta: this._meta, sep: path.sep}, function(

  //   begin,

  //   shallow,  // in. {{ $$files( _meta.shallow ) }}

  //   deep,     // in. {{ $$files( _meta.deep ) }}

  //   concat,   // in. {{ shallow.info.concat deep.info }}

  //   added,    // in. {{ concat.filter (info) -> ! _meta.files[info.value] }}

  //   // TODO: removed (or does watch pick it up?)

  //   resolve

  // ){

  //   added

  //   .map(function(info) {
  //     info.path = info.value.replace(_this._meta.regex, '');
  //     var unjs = info.path.replace(/\.js$/, '');
  //     info.keys = unjs.split(path.sep);
  //     return info;
  //   })

  //   .sort(function(a, b) {

  //     // sort from shallowest to deepest paths so that the
  //     // shallows write first and the deeps can then merge
  //     // in

  //     if (a.keys.length < b.keys.length) return -1;
  //     if (a.keys.length > b.keys.length) return  1;
  //     return 0;
  //   })

  //   .forEach(function(info) {

  //     _this._meta.files[info.value] = 1;

  //     var node = new Node(_this, info);

  //     _this._meta.nodes[info.path] = node;
      
  //   });

  //   // // not first, subsequent adds need to carefully merge if not leaf

  //   // _this._meta.first = false;

  //   resolve();

  // });

  // refresh().then(function() {

  //   callback(null, _this);

  //   setInterval(function() {

  //     if (running) return;

  //     running = true;

  //     refresh().then(function() {

  //       running = false;

  //     }).catch(function(e) {

  //       running = false;
  //       console.log(e.toString());

  //     });

  //   }, _this._meta.interval);

  // }).catch(callback);

});
