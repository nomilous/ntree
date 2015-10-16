module.exports = Vertex;

require('./extends');

var debugs = require('./debugs')('ntree:vertex', [
  'new',
  'walk',
  'init',
  'loadDirectory',
  'createVertexInfo',
  'groupVertexTypes',
  'attachVertexFiles',
  'loadFile',
  'assemble',
  'define',
  'attachVertexDirectories',
  ])
  , Promise = require('bluebird')
  , fs = Promise.promisifyAll(require('fs'))
  , path = require('path')
  , once = require('once')
  , errorize = require('errorize')
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

  debugs.new('(%s) route: %j, fullname: \'%s\'', info.name, info.route, info.fullname);

  info.started = false;

  Object.defineProperty(this, '_info', {
    value: info
  });

  Object.defineProperty(this, '_tree', {
    value: tree
  });


  // List of boundries where joined to other vertices

  Object.defineProperty(this, '_edges', {
    value: {}
  });


  // // Content (data). Can be object or primitive. 

  // // var content = {};

  // Object.defineProperty(this, '_content', {
  //   configurable: true,
  //   writable: true,
  //   value: {}
  //   // get: function() {
  //   //   debug('content get() at route: %j', this._info.route);
  //   //   return content;
  //   // },
  //   // set: function(v) {
  //   //   debug('content set() at route: %j', this._info.route);
  //   //   content = v;
  //   // }
  // });


  // Reference pointer to this vertex's location on the tree.

  Object.defineProperty(this, '_pointer', {
    configurable: true,
    writable: true,
    value: this.walk()
  });

}


/**
 * ## .walk()
 *
 * Assignes this vertex's pointer to it's location in the tree
 *
 */

Vertex.prototype.walk = function() {

  var route = this._info.route;
  var name = this._info.name;

  debugs.walk('(%s) route: %j', name, route);

  if (route.length == 0) return this._tree;

  var pointer = this._tree;

  route.forEach(function(locus) {

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
 * @api public
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

        return _this.loadDirectory(callback)

      }

      // Root of tree is a file. Need to explicitly load the file
      // (as is ususally done recursively in loadDirectory)

      if (route.length == 0) {

        try {

          var extname = path.extname(fullname);
          _this._info.serializer = _this._tree._serializers[extname];
          _this.loadFile();

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

    return _this.loadDirectory(callback)

  }

  if (route.length == 0) {

    try {

      var extname = path.extname(fullname);
      _this._info.serializer = _this._tree._serializers[extname];
      _this.loadFile();

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
  var name = this._info.name;
  var fullname = this._info.fullname;

  debugs.loadDirectory('(%s) directory: \'%s\'', name, fullname);

  // Attach vertex files before directories because the data tree in the
  // file can 'shadow' the neighbouring directory tree. Loading the file
  // first means the file's vertex 'owns' that portion of the tree 
  // despite there being a nested directory named the same as some key
  // in the datatree in the file.

  this.attachVertexDirectories(

    this.attachVertexFiles(

      this.groupVertexTypes(

        this.createVertexInfo(

          fs.readdirAsync(fullname)

        )

      )

    )

  )

  .then(function() {

    callback(null, _this);

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
      files: {}
    };

    var foundFiles = {}

    promise.then(function(list) {

      list.forEach(function(vertexInfo) {

        if (vertexInfo.stat.isDirectory()) {

          vertexSets.directories = vertexSets.directories || [];
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

        var edge = new Edge(_this, edgeName);

        _this._edges[vertexInfo.name] = edge;

        var vertex = new Vertex(_this._tree, vertexInfo);

        edge.link(vertex);

        return vertex.loadFile();

      })

      .then(function() {

        resolve(lists);

      });

    })

    .catch(reject);

  });

}

// Vertex.prototype.loadDirectory = Promise.promisify(function(callback) {

//   var _this = this;
//   var name = this._info.name;
//   var fullname = this._info.fullname;
//   var route = this._info.route;
//   var edges = this._edges;
//   var logger = this._tree._tools.logger;
//   var done = once(callback);

//   var debug = debugs.loadDirectory;

//   debug('at vertex name: \'%s\'', name);

//   fs.readdirAsync(fullname)

//   .then(function(list) {

//     return Promise.map(list, function(nextName) {

//       return new Promise(function(resolve, reject) {

//         debug('found: \'%s\', at vertex name: \'%s\'', nextName, name);

//         var nextInfo = {
//           name: nextName,
//           route: route.slice(), // clone for own copy of the locus stack
//           fullname: fullname + path.sep + nextName,
//         }

//         fs.statAsync(nextInfo.fullname)

//         .then(function(stat) {

//           nextInfo.stat = stat;

//           if (!stat.isDirectory()) {
//             nextInfo.route.push(nextName.replace(/\.js$/, ''));
//           } else {
//             nextInfo.route.push(nextName);
//           }

//           resolve(nextInfo);

//         })

//         .catch(function(e) {

//           debug('error 2 in loadDirectory()', e);

//           // #1:
//           //
//           // rejecting on error would mean breaking the whole
//           // tree because of access denied on one file in it.
//           //
//           // rather ignore
//           //
//           // TODO: some ErrorTypes may be important here

//           if (!e instanceof Error) {

//             // Some errors are not instanceof Error (bad!, fix)

//             var annoyed = new Error();
//             annoyed.message = e.message || e;
//             annoyed.name = e.name || 'Error';
//             try {
//               Object.keys(e).forEach(function(locus) {
//                 annoyed[locus] = e[locus];
//               });
//             } catch (e) {}

//             annoyed.info = nextInfo;

//             return resolve(annoyed);

//           }

//           e.info = nextInfo;

//           logger.warn('error joining to vertex', e);

//           resolve(e);

//         });

//       });

//     });

//   })

//   .then(function(edgesInfos) {

//     return edgesInfos

//     .filter(function(info) {

//       if (info instanceof Error) {
//         logger.warn('error 1 loading vertex', info);
//         return;
//       }

//       if (info.stat.isDirectory()) return true;
//       if (info.name.match(/.js$/)) return true;

//     })

//     .sort(function(a, b) {

//       if (a.stat.isDirectory()) return 1;
//       return -1;

//     })

//     .map(function(info) {

//       debug('creating new vertex with \'%s\', at vertex name: \'%s\'', info.name, name);

//       var vertex = new Vertex(_this._tree, info);

//       try {
        
//         if (info.stat.isDirectory()) {

//           // assign without data

//           console.log('ASSIGN? NECESSARY? HERE?')

//           // vertex.assign();

//         } else {

//           vertex.loadFile();

//         }

//       }

//       catch (e) {

//         return e;

//       }

//       var edge = new Edge(_this, vertex);

//       edges[info.name] = edge.init();

//       return vertex;

//     });

//   })

//   .then(function(vertices) {

//     if (_this._tree._meta.lazy) return done(null, _this);

//     return Promise.map(vertices, function(vertex) {

//       if (vertex instanceof Error) {
//         logger.warn('error 2 loading vertex', vertex.stack);
//         return;
//       }

//       return vertex.init();

//     });

//   })

//   .then(function() {

//     done(null, _this);

//   })

//   .catch(done);

//   // TODO: watch for locus additions in data

//   // TODO: test watch works

//   // fs.watch(this._info.fullname, function() {

//   //   console.log(_this._info.fullname, arguments);

//   // });

//   // control.callback(null, this);

// });


/**
 * ### .loadFile()
 *
 * Loads content of this vertex from a file.
 *
 * @api private
 *
 */

Vertex.prototype.loadFile = function() {

  var fullname = this._info.fullname;
  var name = this._info.name;
  var content;

  debugs.loadFile('file: \'%s\', at vertex name: \'%s\'', fullname, name);

  try {

    // All synchronous to allow for lazy load combined with 
    // unbroken serialization walks into the tree.

    var serializer = this._info.serializer;

    this.assemble(serializer.decode(this));

  }

  catch (e) {

    debugs.loadFile('error 1 in loadFile()', e, e.stack);
    throw e;

  }

}

/**
 * ## .assign(content)
 *
 * Assigns access to this vertex's content at route
 *
 * @api private
 * @param {Object} content
 *
 */

// Vertex.prototype.assign = function(content) {

//   var _this = this;
//   var route = this._info.route;
//   var name = this._info.name;

//   debug('assign() with content: %s at vertex name: \'%s\', route: %j', !!content, name, route);

//   // if (route.length == 0) {
//   //   this._pointer = this._tree;
//   //   return;
//   // }

//   if (this._pointer === null) {

//     debug('new pointer');

//     // this._pointer = this._tree; // TODO: <---------- only the first time

//     route.forEach(function(locus, i) {

//       if (i == route.length - 1) {

//         if (typeof _this._pointer[locus] !== 'undefined') {

//           debug('exists at locus \'%s\'', locus);

//           if (typeof _this._pointer[locus] !== 'object') {
//             if (typeof content == 'object') {
//               throw new Error('Cannot store object at non-object route:' + route.join('/'));
//             }
//           }

//           _this._pointer = _this._pointer[locus];
          
//           if (typeof content !== 'undefined') {
//             console.log('TODO: merge 2');
//           }
//           return;

//         }

//         if (typeof content !== 'undefined') _this.assemble(content);

//         // This branch owns it's whole fragment. Create detector.

//         debug('assign detector at locus: \'%s\'', locus);

//         Object.defineProperty(_this._pointer, locus, {
//           enumerable: true,
//           get: function() {
//             debug('assigned get() at route: %j', _this._info.route);
//             return _this._pointer;
//           },
//           set: function(v) {
//             console.log('SET not yet supported! [A]');
//           }
//         });



//         _this._pointer = _this._pointer[locus];

//         process.nextTick(function() {
//           console.log(locus, 'Assigned!!\n', _this._pointer);
//         });
        

//         return;

//       }

//       // Walk the pointer into the tree along the route locus/locus/locus/...

//       _this._pointer = _this._pointer[locus];

//     });

//     return;

//   }

//   debug('existing pointer');

// }


/**
 * ### .assemble(content)
 *
 * Assembles this vertex's content tree with property value change detectors
 * 
 * @api private
 * @param {Object} content
 *
 */

Vertex.prototype.assemble = function(content) {

  debugs.assemble();

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
    // Others?

    var fromKeys = Object.keys(from);
    // var tokeys = Object.keys(to);

    fromKeys.forEach(function(locus) {

      route.push(locus);

      var localRoute = route.slice();

      _this.define(locus, to, from, localRoute);

      if (typeof from[locus] == 'object') {

        copy(from[locus], to[locus]);

      }

      route.pop();

    });

  }

  copy(content, this._pointer);

}


/**
 * ### .define(locus, object, value)
 *
 * Create a property on object containing value
 *
 * @api
 * @param {String} locus
 * @param {Object} object
 * @param {Object|Number|String|Boolan} value
 * @param {Array} route
 *
 */

Vertex.prototype.define = function(locus, object, value, route) {

  var debug = debugs.define;

  var localValue;

  var type = typeof value[locus];

  // debug('locus: \'%s\', type: \'%s\', value: \'%s\', route: \'%j\'', locus, type, value, route);

  if (type == 'string' || type == 'number' || type == 'boolean') {
    localValue = value[locus];
  } else {
    localValue = {};
  }

  try {

    Object.defineProperty(object, locus, {

      // Set property as NOT configurable to force an error on attempts
      // to redefine. In this way the property becomes 'owned' by
      // the first vertex that created it.
      // 
      // This then allows for overlapping non-leaf vertices/routes
      //
      //   eg.
      //
      //     file: planets.js defining .inner.mercury.properties.radius
      //     and
      //     file: planets/inner/mercury/properties.js
      //     (as long as properties.js does not attempt to redefine radius)

      configurable: false,

      enumerable: true,

      get: function() {
        debug('get() at route: %j', route);
        return localValue;
      },

      set: function(v) {

        // TODO: Elaborate set() (change detection and handling)

        debug('set() at route: %j', route);
        localValue = v;
      }

    });

  } catch (e) {

    debug('not owner at route: %j', route, e);

  }

};


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

      var edge = new Edge(_this, edgeName);

      _this._edges[vertexInfo.name] = edge;

      var vertex = new Vertex(_this._tree, vertexInfo);

      edge.link(vertex);

      return;

    });

  });

}




