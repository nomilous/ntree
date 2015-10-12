module.exports = Vertex;

var debug = require('debug')('ntree:vertex')
  , Promise = require('bluebird')
  , fs = require('fs')
  , path = require('path')
  , readdirAsync = Promise.promisify(fs.readdir)
  , statAsync = Promise.promisify(fs.stat)
  , once = require('once')
  , Edge = require('./edge')
  ;


/**
 * ## class Vertex()
 *
 * Creates a Vertex instance which:
 * 
 * * Is attached to the tree at the specified `info.route` path.
 * * Houses the content of the data fragment at `info.fullname` (filname).
 * * 
 *
 * @api public
 * @constructor
 * @param {Tree} tree
 * @param {{route: Array, fullname: String}} info
 *
 */

function Vertex(tree, info) {

  info.started = false;

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
    value: {}
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
 * * Each found becomes a new Vertex instance nested into `this` at `locus` per dir or file basename
 *
 * @api public
 * @param {Function} [callback]
 * @returns {Promise}
 *
 */

Vertex.prototype.loadAsync = Promise.promisify(function(callback) {

  var _this = this;
  var name = this._info.name;
  var route = this._info.route;

  debug('loadAsync() at vertex name: \'%s\', route: %j', name, route);

  if (this._info.started) return callback(null, this);

  this._info.started = true;

  if (typeof this._info.stat == 'undefined') {

    debug('load missing stat at vertex name: \'%s\'', name);

    statAsync(this._info.fullname)

    .then(function(stat) {

      _this._info.stat = stat;

      if (_this._info.stat.isDirectory()) {

        return _this.loadAsDirAsync(callback)

      }

      if (route.length == 0) {

        // Incase mount points directly to file.
        // In other cases (directory loader `loadAsDirAsync` loads the files)

        try {

          _this.loadAsFile();

        } 

        catch (e) {

          return callback(e);

        }

      }

      callback(null, _this);

    })

    .catch(function(e) {

      callback(e);

    });

    return;

  }

  if (_this._info.stat.isDirectory()) {

    return _this.loadAsDirAsync(callback)

  }

  if (route.length == 0) {

    try {

      _this.loadAsFile();

    }

    catch (e) {

      return callback(e);

    }

  }

  callback(null, this);

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
  var name = this._info.name;
  var fullname = this._info.fullname;
  var route = this._info.route;
  var edges = this._edges;
  var logger = this._tree._tools.logger;
  var done = once(callback);

  debug('loadAsDirAsync() at vertex name: \'%s\'', name);

  readdirAsync(fullname)

  .then(function(list) {

    return Promise.map(list, function(nextName) {

      return new Promise(function(resolve, reject) {

        debug('loadAsDirAsync() at vertex name: \'%s\', found: \'%s\'', name, nextName);

        var nextInfo = {
          name: nextName,
          route: route.slice(), // clone for own copy of the locus stack
          fullname: fullname + path.sep + nextName,
        }

        statAsync(nextInfo.fullname)

        .then(function(stat) {

          nextInfo.stat = stat;

          if (!stat.isDirectory()) {
            nextInfo.route.push(nextName.replace(/\.js$/, ''));
          } else {
            nextInfo.route.push(nextName);
          }

          resolve(nextInfo);

        })

        .catch(function(e) {

          debug('error 2 in loadAsDirAsync()', e);

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
            Object.keys(e).forEach(function(locus) {
              annoyed[locus] = e[locus];
            });

            annoyed.info = nextInfo;

            return resolve(annoyed);

          }

          e.info = nextInfo;

          logger.warn('error joining to vertex', e);

          resolve(e);

        });

      });

    });

  })

  .then(function(edgesInfos) {

    return edgesInfos

    .filter(function(info) {

      if (info instanceof Error) {
        logger.warn('error 1 loading vertex', info);
        return;
      }

      if (info.stat.isDirectory()) return true;
      if (info.name.match(/.js$/)) return true;

    })

    .sort(function(a, b) {

      if (a.stat.isDirectory()) return 1;
      return -1;

    })

    .map(function(info) {

      debug('loadAsDirAsync() at vertex name: \'%s\' creating new vertex with \'%s\'', name, info.name);

      var merge = false;
      var vertex = new Vertex(_this._tree, info);

      try {
        
        if (info.stat.isDirectory()) {

          vertex.assign(merge);

        } else {

          vertex.loadAsFile();

        }

      }

      catch (e) {

        return e;

      }

      var edge = new Edge(_this, vertex);

      edges[info.name] = edge.init();

      return vertex;

    });

  })

  .then(function(vertices) {

    if (_this._tree._meta.lazy) return done(null, _this);

    return Promise.map(vertices, function(vertex) {

      if (vertex instanceof Error) {
        logger.warn('error 2 loading vertex', vertex);
        return;
      }

      return vertex.loadAsync();

    });

  })

  .then(function() {

    done(null, _this);

  })

  .catch(done);

  // TODO: watch for locus additions in data

  // TODO: test watch works

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
 *
 */

Vertex.prototype.loadAsFile = function() {

  var fullname = this._info.fullname;
  var name = this._info.name;

  debug('loadAsFile() at vertex name: \'%s\', file: \'%s\'', name, fullname);

  try {

    delete require.cache[fullname];

    this._content = require(fullname);

    this.assign(true);

  }

  catch (e) {

    debug('error 1 in loadAsFile()', e);
    throw e;

  }

}

/**
 * ## .assign()
 *
 * Merges data onto the tree
 *
 * @api private
 *
 */

Vertex.prototype.assign = function(merge) {

  if (typeof merge !== 'boolean') merge = false;

  var _this = this;
  var route = this._info.route;
  var name = this._info.name;

  debug('assign() with merge: %s at vertex name: \'%s\', route: %j', merge, name, route);

  if (route.length == 0) {
    this._pointer = this._tree;
    return;
  }

  if (this._pointer === null) {

    debug('new pointer');

    this._pointer = this._tree;

    route.forEach(function(locus, i) {

      if (i == route.length - 1) {

        if (typeof _this._pointer[locus] !== 'undefined') {

          debug('exists at locus \'%s\'', locus);

          if (typeof _this._pointer[locus] !== 'object') {
            if (typeof _this._content == 'object') {
              throw new Error('Cannot store object at non-object route:' + route.join('/'));
            }
          }

          _this._pointer = _this._pointer[locus];
          
          if (merge) {
            console.log('TODO: merge');
          }
          return;

        }

        // This branch owns it's whole fragment. Create detector.

        debug('create detector at locus: \'%s\'', locus);

        Object.defineProperty(_this._pointer, locus, {
          enumerable: true,
          get: function() {
            debug('get() at route: %j', _this._info.route);
            return _this._content;
          },
          set: function(v) {
            console.log('SET not yet supported! [A]');
          }
        });

        _this._pointer = _this._pointer[locus];

        if (merge) {
          console.log('TODO: merge');
        }

        return;

      }

      // Walk the pointer into the tree along the route locus/locus/locus/...

      _this._pointer = _this._pointer[locus];

    });

    return;

  }

  debug('existing pointer');

}


