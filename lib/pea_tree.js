var Promise = require('bluebird');

module.exports.PeaTree = PeaTree;

module.exports.create = Promise.promisify(function(config, callback) {

  if (typeof config === 'function') {
    callback = config;
    config = {
      root: process.cwd()
    };
  }

  var peatree = new PeaTree(config);

  peatree.start(callback);

});


function PeaTree(config) {

  Object.defineProperty(this, 'root', {
    value: config.root
  });

}

PeaTree.prototype.start = Promise.promisify(function(callback) {

  callback(null, this);

});
