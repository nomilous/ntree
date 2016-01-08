var Tree = require('./lib/tree');
var Errors = require('./lib/errors');
var Promise = require('bluebird');

module.exports.create = function(opts) {

  if (typeof opts === 'undefined') opts = {};
  if (typeof opts === 'string') {
    opts = {
      mount: opts
    }
  }

  return new Promise(function(resolve, reject) {
    
    if (!opts.mount) return reject(new Error('missing opts.mount'));
    
    var tree = new Tree(opts);

    tree._start().then(resolve).catch(reject);

  });

};

module.exports.Tree = Tree;
module.exports.Errors = Errors;
