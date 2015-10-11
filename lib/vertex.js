module.exports = Vertex;

var Promise = require('bluebird');
var fs = require('fs');
var readdirAsync = Promise.promisify(fs.readdir);
var statAsync = Promise.promisify(fs.stat);


/**
 * ## class Vertex()
 *
 * Creates a Vertex instance which:
 * 
 * * Is attached to the tree at the specified `info.keys` path.
 * * Houses the content of the data fragment at `info.fullname` (filname).
 * * 
 *
 * @api public
 * @constructor
 * @param {Tree} tree
 * @param {{keys: Array, fullname: String}} info
 *
 */

function Vertex(tree, info) {

  Object.defineProperty(this, '_info', {
    value: info
  });

  Object.defineProperty(this, '_tree', {
    value: tree
  });

}


/**
 * 
 * ## .loadAsync(callback)
 *
 * Initializes this Vertex instance:
 *
 * * Scans the directory `this._info.fullname` nested directories or js files
 * * Each found becomes a new Vertex instance nested into `this` at key per dir or file basename
 *
 * @api public
 * @param {Function} [callback]
 * @returns {Promise}
 *
 */

Vertex.prototype.loadAsync = Promise.promisify(function(callback) {

  var control = {
    callback: callback
  };

  var _this = this;

  if (typeof this._info.stat == 'undefined') {

    return statAsync(this._info.fullname)

    .then(function(stat) {

      _this._info.stat = stat;

      if (_this._info.stat.isDirectory()) {

        return _this.loadAsDirAsync(control)

      }

      _this.loadAsFileAsync(control);

    })

    .catch(function(e) {

      if (control.callback) {
        control.callback(e);
        delete control.callback;
      }

    });

  }

  if (_this._info.stat.isDirectory()) {

    return _this.loadAsDirAsync(control)

  }

  _this.loadAsFileAsync(control);

});


/**
 *
 * ## .loadSync()
 *
 * Initializes the Vertex instance:
 *
 * @api public
 * @returns {Error}
 *
 */

Vertex.prototype.loadSync = function() {

  return new Error('not implemented');

}


