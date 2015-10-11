module.exports = Vertex;

var Promise = require('bluebird');
var fs = require('fs');
var path = require('path');
var readdirAsync = Promise.promisify(fs.readdir);
var statAsync = Promise.promisify(fs.stat);

var Edge = require('./edge');


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

  Object.defineProperty(this, '_edges', {
    value: {}
  });

  Object.defineProperty(this, '_content', {
    configurable: true,
    writable: true,
    value: null
  });

  Object.defineProperty(this, '_pointer', {
    configurable: true,
    writable: true,
    value: null
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

        return _this.loadAsDirAsync(control.callback)

      }

      var e = _this.loadAsFile();

      if (control.callback) {
        control.callback(e, _this);
        delete control.callback;
      }

    })

    .catch(function(e) {

      if (control.callback) {
        control.callback(e);
        delete control.callback;
      }

    });

  }

  if (_this._info.stat.isDirectory()) {

    return _this.loadAsDirAsync(control.callback)

  }

  _this.loadAsFileAsync(control.callback);

});

/**
 *
 * ## .loadAsDirAsync(control)
 *
 * Loads the 'child' vertices of `this` vertex and:
 * 
 * * Sets a watch on the directory to detect new children 
 *
 * @api private
 * @param {{callback: Function}} control
 *
 */

Vertex.prototype.loadAsDirAsync = Promise.promisify(function(callback) {

  var _this = this;
  var logger = this._tree._tools.logger;
  var thisInfo = _this._info;

  var control = {
    callback: callback
  };

  readdirAsync(this._info.fullname)

  .then(function(list) {

    return Promise.all(

      list.map(function(name) {

        return new Promise(function(resolve, reject) {

          var edgeInfo = {

            name: name,
            keys: thisInfo.keys.slice(),
            fullname: thisInfo.fullname + path.sep + name,

          }

          statAsync(edgeInfo.fullname)

          .then(function(stat) {

            edgeInfo.stat = stat;

            if (!stat.isDirectory()) {
              edgeInfo.keys.push(name.replace(/\.js$/, ''));
            } else {
              edgeInfo.keys.push(name);
            }

            resolve(edgeInfo);

          })

          .catch(function(e) {

            // #1:
            //
            // rejecting on error would mean breaking the whole
            // tree because of access denied on one file in it.
            //
            // rather ignore
            //
            // TODO: some ErrorTypes may be important here

            if (!e instanceof Error) {

              var annoyed = new Error();
              annoyed.message = e.message || e;
              annoyed.name = e.name || 'Error';
              Object.keys(e).forEach(function(key) {
                annoyed[key] = e[key];
              });

              annoyed.info = edgeInfo;

              return resolve(annoyed);

            }

            e.info = edgeInfo;

            resolve(e);

          });

        });

      })

    )

  })

  .then(function(edgesInfos) {

    return edgesInfos.sort(function(a, b) {

      if (a.stat.isDirectory()) return 1;
      return -1;

    })

    .map(function(info) {

      if (info instanceof Error) {
        logger.warn('error joining to vertex', info);
        return;
      }

      var vertex = new Vertex(_this._tree, info);
      var edge = new Edge(info.name, _this, vertex);
      _this._edges[info.name] = edge;
      edge.init();
      return vertex;

    });

  })

  .then(function(vertices) {

    if (_this._tree._meta.lazy) {
      if (control.callback) {
        control.callback(null, _this);
        delete control.callback;
      }
    };

    console.log('PENDING callback __ new vertices', vertices);

  })

  .catch(function(e) {

    if (control.callback) {
      control.callback(e);
      delete control.callback;
    }

  });

  // fs.watch(this._info.fullname, function() {

  //   console.log(_this._info.fullname, arguments);

  // });

  // control.callback(null, this);

});


/**
 * ## .loadFile()
 *
 * Loads data from the file onto the tree
 *
 * @api private
 * @returns {Error}
 *
 */

Vertex.prototype.loadAsFile = function() {

  try {

    var filename = this._info.fullname;

    delete require.cache[filename];

    this._content = require(filename);

    this.update();

  }

  catch (e) {return e;}

}

/**
 * ## .update()
 *
 * Merges data onto the tree
 *
 * @api private
 *
 */

Vertex.prototype.update = function() {

  var _this = this;
  var keys = this._info.keys;
  
  if (this._pointer === null) {

    this._pointer = this._tree;

    keys.forEach(function(key, i) {

      if (i == keys.length - 1) {

        if (typeof _this._pointer[key] !== 'undefined') {

          // When this fragment's outer key already exists
          // then this fragment does not 'own' the whole 
          // branch where it's rooted.
          //
          // ie. No watches are placed other than those at
          //     the keys where this fragment placed data.
          //

          if (typeof _this._pointer[key] !== 'object') {
            if (typeof _this._content == 'object') {
              throw new Error('Cannot store object at non-object key:' + keys.join('/'));
            }
          }

          _this._pointer = _this._pointer[key];
          return;

        }

        // This branch owns it's whole fragment. Create attachment.

        Object.defineProperty(_this._pointer, key, {
          enumerable: true,
          get: function() {
            return _this._content;
          },
          set: function(v) {
            console.log('SET not yet supported!');
          }
        });

      }

      // Walk the pointer into the tree along the key path.

      _this._pointer = _this._pointer[key];

    });

  }

}


