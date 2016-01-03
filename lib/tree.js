module.exports = Tree;

var Promise = require('bluebird');
var EventEmitter = require('events').EventEmitter;
var serializers = require('./serializers');
var Tools = require('./tools');


function Tree(opts) {

  Object.defineProperty(this, '_opts', {
    enumerable: false,
    configurable: false,
    value: opts
  });

  Object.defineProperty(this, '_tools', {
    enumerable: false,
    configurable: false,
    value: new Tools(this)
  });

  Object.defineProperty(this, '_serializers', {
    enumerable: false,
    configurable: false,
    value: {}
  });

  this.registerSerializer(new serializers.Directory());
  this.registerSerializer(new serializers.Javascript());

  Object.defineProperty(this, '_emitter', {
    enumerable: false,
    configurable: false,
    value: new EventEmitter()
  });

  Object.defineProperty(this, 'on', {
    enumerable: false,
    configurable: false,
    value: function() {
      this._emitter.on.apply(this._emitter, arguments);
    }
  });

  Object.defineProperty(this, 'once', {
    enumerable: false,
    configurable: false,
    value: function() {
      this._emitter.once.apply(this._emitter, arguments);
    }
  });

  this.on('$load', function(source) {
    console.log('$load', source);
  });

}

Tree.prototype.registerSerializer = function(serializer) {
  var serializers = this._serializers;
  serializer.extensions.forEach(function(ext) {
    serializers[ext] = serializer;
  });
}

Tree.prototype._assemble = function() {
  var _this = this;
  return new Promise(function(resolve, reject) {

    var emitter = _this._emitter;
    var filename = _this._opts.mount;

    return _this._tools.readdirRecurseAsync(emitter, filename)

    .then(function(dir) {
      console.log('filename done');
      resolve(_this);
    })

    .catch(reject);
  });
}
