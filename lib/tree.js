var Promise = require('bluebird');
var path = require('path');
var Node = require('./node');

require('in.');

module.exports.Tree = Tree;

module.exports.create = Promise.promisify(function(config, callback) {

  if (typeof config === 'function') {
    callback = config;
    config = null
  }

  var tree = new Tree(config);

  tree.start(callback);

});


function Tree(config) {

  config = config || {};

  config.interval = config.interval || 1000;

  config.mount = config.mount || process.cwd();
  config.mount = path.normalize(config.mount);
  config.mount = config.mount.replace(new RegExp(path.sep + '$'), '');

  Object.defineProperty(this, '_meta', {
    value: {
      mount: config.mount,
      regex: new RegExp('^' + config.mount + path.sep),
      shallow: config.mount + path.sep + '*.js',
      deep: config.mount + path.sep + '**' + path.sep + '*.js',
      interval: config.interval,
      files: {},
      nodes: {},
      // first: true,
    }
  });

}

Tree.prototype.start = Promise.promisify(function(callback) {

  var _this = this;

  var running = false;

  var refresh = $$in({_meta: this._meta, sep: path.sep}, function(

    begin,

    shallow,  // in. {{ $$files( _meta.shallow ) }}

    deep,     // in. {{ $$files( _meta.deep ) }}

    concat,   // in. {{ shallow.info.concat deep.info }}

    added,    // in. {{ concat.filter (info) -> ! _meta.files[info.value] }}

    // TODO: removed (or does watch pick it up?)

    resolve

  ){

    added

    .map(function(info) {
      info.path = info.value.replace(_this._meta.regex, '');
      var unjs = info.path.replace(/\.js$/, '');
      info.keys = unjs.split(path.sep);
      return info;
    })

    .sort(function(a, b) {

      // sort from shallowest to deepest paths so that the
      // shallows write first and the deeps can then merge
      // in

      if (a.keys.length < b.keys.length) return -1;
      if (a.keys.length > b.keys.length) return  1;
      return 0;
    })

    .forEach(function(info) {

      _this._meta.files[info.value] = 1;

      var node = new Node(_this, info);

      _this._meta.nodes[info.path] = node;
      
    });

    // // not first, subsequent adds need to carefully merge if not leaf

    // _this._meta.first = false;

    resolve();

  });

  refresh().then(function() {

    callback(null, _this);

    setInterval(function() {

      if (running) return;

      running = true;

      refresh().then(function() {

        running = false;

      }).catch(function(e) {

        running = false;
        console.log(e.toString());

      });

    }, _this._meta.interval);

  }).catch(callback);

});
