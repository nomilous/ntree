module.exports = Vertex;

var debugs = require('./debugs')('ntree:vertex', [
  'new',
  'walk',
  'init',
  'initSync',
  'loadDirectory',
  'createVertexInfo',
  'groupVertexTypes',
  'attachVertexFiles',
  'loadFileSync',
  'attachContent',
  'define',
  'attachVertexDirectories',
  'onCreatedKey',
  'onUpdatedKey',
  ])
  , Promise = require('bluebird')
  , fs = Promise.promisifyAll(require('fs'))
  , path = require('path')
  , once = require('once')
  , errorize = require('errorize')
  , Edge = require('./edge')
  , Agent = require('./agent')
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
 * @api private
 * @constructor
 * @param {Tree} tree
 * @param {{route: Array, fullname: String}} info
 *
 */

function Vertex(tree, info) {

  debugs.new('(%s) route: %j, fullname: \'%s\'', info.name, info.route, info.fullname);

  info.started = false;

  Object.defineProperty(this, '_info', {
    value: info
  });

  Object.defineProperty(this, '_tree', {
    value: tree
  });


  // List of boundries to other vertices

  Object.defineProperty(this, '_edges', {
    enumerable: this.constructor.name != 'Tree',
    value: {}
  });

  // List of property agents contained in this vertex

  Object.defineProperty(this, '_agents', {
    enumerable: this.constructor.name != 'Tree',
    value: {}
  });

  // Reference pointer to this vertex's location on the tree.

  Object.defineProperty(this, '_pointer', {
    enumerable: this.constructor.name != 'Tree',
    configurable: true,
    writable: true,
    value: this.walk()
  });

  // Confine serialization walk to only this vertex

  var confine = false;

  Object.defineProperty(this, '_confine', {
    set: function(v) {
      confine = v;
      tree._confine = v;
    }
  });

  Object.defineProperty(this, '_exclude', {
    get: function() {
      if (tree._confine) {
        return !confine;
      }
      return false;
    }
  });

}


/**
 * ## .walk()
 *
 * Assignes this vertex's pointer to it's location in the tree
 *
 * @api private
 *
 */

Vertex.prototype.walk = function() {

  var route = this._info.route;
  var name = this._info.name;

  debugs.walk('(%s) route: %j', name, route);

  if (route.length == 0) return this._tree;

  var pointer = this._tree;

  route.forEach(function(locus) {

    if (typeof pointer[locus] == 'undefined') {

      // TODO: ownership?

      pointer[locus] = {};

    }

    pointer = pointer[locus];

  });

  return pointer;
  
}


/**
 * 
 * ### .init(callback)
 *
 * Initializes this Vertex instance:
 *
 * * Scans the directory `this._info.fullname` nested directories or js files
 * * Each found becomes a new Vertex instance nested into `this` at `locus` per dir or file basename
 *
 * @api private
 * @param {Function} [callback]
 * @returns {Promise}
 *
 */

Vertex.prototype.init = Promise.promisify(function(callback) {

  var _this = this;
  var name = this._info.name;
  var route = this._info.route;
  var fullname = this._info.fullname;

  debugs.init('(%s) route: %j', name, route);

  if (this._info.started) return callback(null, this);

  this._info.started = true;

  if (typeof this._info.stat == 'undefined') {

    debugs.init('(%s) load missing stat: \'%s\'', name, fullname);

    fs.statAsync(fullname)

    .then(function(stat) {

      _this._info.stat = stat;

      if (_this._info.stat.isDirectory()) {

        _this._info.serializer = _this._tree._serializers['.directory'];
        return _this.loadDirectory(callback)

      }

      // Root of tree is a file. Need to explicitly load the file
      // (as is ususally done recursively in loadDirectory)

      if (route.length == 0) {

        try {

          var extname = path.extname(fullname);
          _this._info.serializer = _this._tree._serializers[extname];
          _this.loadFileSync();

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

  if (this._info.stat.isDirectory()) {

    this._info.serializer = this._tree._serializers['.directory'];
    return _this.loadDirectory(callback)

  }

  if (route.length == 0) {

    try {

      var extname = path.extname(fullname);
      this._info.serializer = this._tree._serializers[extname];
      this.loadFileSync();

    }

    catch (e) {

      return callback(e);

    }

  }

  callback(null, this);

});


/**
 *
 * ### .loadDirectory(callback)
 *
 * Loads the 'child' vertices of `this` from a direcory
 * 
 *
 * @api private
 * @param {Function} callback
 *
 */

Vertex.prototype.loadDirectory = Promise.promisify(function(callback) {

  var _this = this;
  var info = this._info;
  var serializer = this._info.serializer;

  debugs.loadDirectory('(%s) directory: \'%s\'', info.name, info.fullname);

  this.attachVertexDirectories(

    this.attachVertexFiles(

      this.groupVertexTypes(

        this.createVertexInfo(

          serializer.decodeAsync(_this)

        )

      )

    )

  )

  .then(function(nextList) {

    // nextList (directories) recurse

    return Promise.map(nextList, function(vertex) {

      // some may have been ignored

      if (vertex) return vertex.init();

    });

  })

  .then(function() {

    return callback(null, _this);

  })

  .catch(callback);

});


/**
 * ### .createVertexInfo(list)
 *
 * Accepts the promise of a directory listing and returns the promise
 * of a list of corresponding stat()ed vertex configs [vertexInfo] 
 *
 * @api private
 * @params {Promise} promise
 * @returns {Promise}
 *
 * @todo Enable full paths in list for ability to 'jump' the Edge
 *
 */

Vertex.prototype.createVertexInfo = function(promise) {

  var info = this._info;
  var name = info.name;
  var fullname = info.fullname;
  var route = info.route;
  var debug = debugs.createVertexInfo;

  var vertexInfo = [];

  return new Promise(function(resolve, reject) {

    Promise.map(promise, function(item) {

      debug('(%s) found: \'%s\'', name, item);

      var filename;

      vertexInfo.push({

        // Push preliminary vertex info for each found item in 
        // directory, still pending per item stat() and the
        // dir/file specific bits.

        name: item,
        route: route.slice(), // clone for own copy of the locus stack
        fullname: filename = fullname + path.sep + item,

      });

      // Need to resolve (not reject) stat errors so that the
      // full list becomes available, some with stat and some
      // with error. This is so that the tree can still load
      // even if some of the files in the recursion path are
      // not readable by the running uid.

      return new Promise(function(resolve) {

        fs.statAsync(filename).then(resolve).catch(errorize(resolve));

      });

    })

    .then(function(stats) {

      return stats

      .map(function(stat, i) {

        var vi = vertexInfo[i]

        vi.stat = stat;

        if (stat.isDirectory && stat.isDirectory()) {
          vi.route.push(vi.name);
        } else {
          vi.route.push(vi.name.replace(/\.js$/, ''));
        }

        return vi;

      })

      .filter(function(vi) {

        // TODO: ?? Take the load errors into the tree as edge of type Error

        return ! (vi.stat instanceof Error);

      });

    })

    .then(resolve).catch(reject);

  });

}


/**
 * ### .groupVertexTypes(promise)
 *
 * Accepts the promise of a list of vertexInfo configs and returns the promise
 * of them grouped into sets per file extension assigned serializer.
 *
 * @api private
 * @params {Promise} promise
 * @returns {Promise}
 *
 * @todo Extend to support any file type with loader created for each ext
 *
 */

Vertex.prototype.groupVertexTypes = function(promise) {

  var debug = debugs.groupVertexTypes;
  var name = this._info.name;
  var serializers = this._tree._serializers;

  return new Promise(function(resolve, reject) {

    var vertexSets = {
      directories: [],
      files: {}
    };

    var foundFiles = {};

    var names = {};

    promise.then(function(list) {

      list.forEach(function(vertexInfo) {

        var name = vertexInfo.route.last;

        if (names[name]) {

          // shared, eg.
          // ./planets.js
          // ./planets/...deeper

          vertexInfo.shared = true;
          names[name].shared = true;

        }
        
        else {

          vertexInfo.shared = false;
          names[name] = vertexInfo;

        }

        if (vertexInfo.stat.isDirectory()) {

          vertexSets.directories.push(vertexInfo);
          return;

        }

        var extname = path.extname(vertexInfo.name);
        var serializer = serializers[extname];

        if (serializer) {

          vertexInfo.serializer = serializer;
          vertexSets.files[extname] = vertexSets.files[extname] || [];
          foundFiles[extname] = foundFiles[extname] || 0;
          foundFiles[extname]++;

          vertexSets.files[extname].push(vertexInfo);
          return;

        }

      });

      debug(
        '(%s) directories: %d, files: %j',
        name,
        vertexSets.directories.length,
        foundFiles
      );

      resolve(vertexSets);

    })

    .catch(reject);

  });

}


/**
 * ### .attachVertexDirectories(promise)
 *
 * Accepts the promise of a list of directories and creates the
 * representative Edge and Vertex to attach to `this` vertex.
 *
 * @api private
 * @param {Promise} promise
 * @returns {Promise}
 *
 */

Vertex.prototype.attachVertexDirectories = function(promise) {

  var debug = debugs.attachVertexDirectories;

  var _this = this;

  return promise.then(function(list) {

    return Promise.map(list.directories, function(vertexInfo) {

      var edgeName = vertexInfo.route.last

      var vertex = new Vertex(_this._tree, vertexInfo);

      var edge = new Edge(_this, edgeName, vertex);

      if (vertex.ignore) return;

      _this._edges[vertexInfo.name] = edge;

      return vertex; // nextList (directories)

    });

  });

}


/**
 * ### .attachVertexFiles(promise)
 *
 * Accepts the promise of a list of vertex configs and for each of the file
 * vertexes create an Edge joined to the tree and create a vertex attached
 * on the 'other side' of the edge.
 *
 * @api private
 * @param {Promise} promise
 * @returns {Promise}
 *
 * @todo serializers per file type
 *
 */

Vertex.prototype.attachVertexFiles = function(promise) {

  var debug = debugs.attachVertexFiles;
  var name = this._info.name;
  var _this = this;

  return new Promise(function(resolve, reject) {

    promise.then(function(lists) {

      // TODO: order of file types could become important

      var list = [];

      Object.keys(lists.files).map(function(ext) {

        list = list.concat(lists.files[ext]);

      });

      return Promise.map(list, function(vertexInfo) {

        var edgeName = vertexInfo.route.last

        var vertex = new Vertex(_this._tree, vertexInfo);

        var edge = new Edge(_this, edgeName, vertex);

        if (vertex.ignore) return;

        _this._edges[vertexInfo.name] = edge;

        return vertex.loadFileSync();

      })

      .then(function() {

        resolve(lists);

      });

    })

    .catch(reject);

  });

}


/**
 * ### .loadFileSync()
 *
 * Loads content of this vertex from a file.
 *
 * @api private
 *
 */

Vertex.prototype.loadFileSync = function() {

  var fullname = this._info.fullname;
  var name = this._info.name;
  var content;

  debugs.loadFileSync('file: \'%s\', at vertex name: \'%s\'', fullname, name);

  try {

    var serializer = this._info.serializer;

    this.attachContent(serializer.decodeSync(this));

    this._info.started = true;

  }

  catch (e) {

    debugs.loadFileSync('error 1 in loadFile()', e, e.stack);
    throw e;

  }

}


/**
 * ### .attachContent(content)
 *
 * Attach content to this vertex with property value change detectors
 * 
 * @api private
 * @param {Object} content
 *
 */

Vertex.prototype.attachContent = function(content) {

  debugs.attachContent();

  var _this = this;

  var type = typeof content;

  var route = this._info.route.slice();

  if (type == 'string' || type == 'number' || type == 'boolean') {
    // this.define('_content', this, content, route);
    this._pointer = content;
    return;
  }

  var copy = function(from, to) {

    if (Array.isArray(from)) throw new Error('pending Array support');
    if (from instanceof Date) throw new Error('pending Date support');
    if (from instanceof RegExp) throw new Error('pending RegExp support');
    if (from instanceof Buffer) throw new Error('pending Buffer support');
    if (from instanceof Function) throw new Error('pending Function support');
    // Others?

    var fromKeys = Object.keys(from);
    // var tokeys = Object.keys(to);

    fromKeys.forEach(function(locus) {

      route.push(locus);

      var localRoute = route.slice();

      var agent = new Agent(_this, locus, to, from, localRoute);

      // _this.define(locus, to, from, localRoute);

      _this._agents[agent.routeString] = agent;

      if (typeof from[locus] == 'object') {

        // recurse

        copy(from[locus], to[locus]);

      }

      route.pop();

    });

  }

  copy(content, this._pointer);

}


/**
 * ### .onCreatedKey(key, agent)
 *
 * Called when a new key/value is created somewhere in the domain
 * of this vertex.
 *
 * @api private
 * @param {String} key
 * @param {Agent|Edge} agent that detected the creation
 *
 */

Vertex.prototype.onCreatedKey = function(key, agent) {

  var name = this._info.name;
  var serializer = this._info.serializer;

  debugs.onCreatedKey(
    '(%s) handling new key: \'%s\', at path: \'%s\', serailizer: \'%s\'',
    name,
    key,
    agent.routeString,
    serializer.constructor.name
  );

  var newValue = agent.getSync()[key];

  if (serializer.constructor.name !== 'Directory') {
    return serializer.encodeSync(this, {
      change: 'update',
      key: key,
      value: newValue
    });
  }

  if (typeof newValue == 'object') {

    if (Object.keys(newValue).length == 0) {

      return serializer.encodeSync(this, {
        change: 'create',
        key: key,
        value: newValue
      })

    }

  }

  // createing new file, default to js

  serializer = this._tree._serializers['.js'];

  return serializer.encodeSync(this, {
    change: 'create',
    key: key,
    value: newValue
  });

}


/**
 * ### .onUpdatedKey(key, agent)
 *
 * @api private
 * @param {String} key
 * @param {Agent} agent
 *
 */

Vertex.prototype.onUpdatedKey = function(key, agent, oldValue, newValue) {

  var name = this._info.name;
  var serializer = this._info.serializer;

  debugs.onUpdatedKey(
    '(%s) handling updated key: \'%s\', at path: \'%s\', serailizer: \'%s\'',
    name,
    key,
    agent.routeString,
    serializer.constructor.name
  );

  return serializer.encodeSync(this, {
    change: 'update',
    key: key
  });


}

