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

  config = config || {
    mount: process.cwd(),
    interval: 1000,
  }

  Object.defineProperty(this, '_meta', {
    value: {
      mount: config.mount,
      shallow: config.mount + path.sep + '*.js',
      deep: config.mount + path.sep + '**' + path.sep + '*.js',
      interval: config.interval,
      files: {},
      nodes: {},
    }
  });

}

Tree.prototype.start = Promise.promisify(function(callback) {

  var _this = this;

  var running = false;

  var refresh = $$in({_meta: this._meta}, function(

    begin,

    shallow,  // in. {{ $$files( _meta.shallow ) }}

    deep,     // in. {{ $$files( _meta.deep ) }}

    concat,   // in. {{ shallow.info.concat deep.info }}

    added,    // in. {{ concat.filter (info) -> ! _meta.files[info.value] }}

    // TODO: removed (or does watch pick it up?)

    resolve

  ){

    added.forEach(function(info) {

      _this._meta.files[info.value] = 1;

      var node = new Node(_this, info);

      _this._meta.nodes[node.path] = node;
      
    });

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
