objective('Vertex', function() {

  before(function(Vertex) {

    mock('prototype', Vertex.prototype);
    mock('expect', require('chai').expect);

  });

  beforeEach(function(path) {

    mock('tree', {
      _meta: {
        lazy: false
      },
      _tools: {
        logger: console
      },
      _pointer: {
      }
    });
    mock('mount', {
      value: path.normalize(__dirname + '/../test_data')
    });

  });

  context('walk()', function() {

    it('returns the tree if vertex route is root (no keys)',

      function(done, expect, Vertex) {

        var v = new Vertex('TREE', {route: []});
        expect(v.walk()).to.equal('TREE');
        done();

      }
    );

    it('returns the place in the tree that route points to',

      function(done, expect, Vertex) {

        var v = new Vertex({one: { two: { three: 3}}}, {route: ['one', 'two', 'three']});
        expect(v.walk()).to.equal(3);
        done();

      }
    );

  });

  context('init()', function() {

    it('calls loadFile() if stat.isDirectory() is false and route is root',

      function(done, tree, mount, prototype, fs, Vertex) {

        mount.value = __filename;

        var v = new Vertex(tree, {route: [], fullname: mount.value});

        prototype.does(function loadFile() {
          
        });

        v.init().then(done).catch(done);

      }
    );


    it('does not call loadFile() stat.isDirectory() is false and route is not root',
      
      function(done, tree, mount, prototype, Vertex) {

        // var ran = false;

        mount.value = __filename;

        var v = new Vertex(tree, {route: ['locus'], fullname: mount.value});

        prototype.spy(function loadFile() {
          throw new Error('should not run');
        });

        v.init().then(done).catch(done);

      }
    );


    it('calls loadDirectory() if stat.isDirectory() is true and route is root',

      function(done, tree, mount, prototype, Vertex) {

        mount.value = __dirname;

        var v = new Vertex(tree, {route: [], fullname: mount.value});

        prototype.does(function loadDirectory(callback) {
          callback();
        });

        v.init().then(done).catch(done);

      }
    );


    it('uses existing stat if present',

      function(done, tree, mount, prototype, fs, Vertex) {

        mount.value = __dirname;

        var v = new Vertex(tree, {
          route: [],
          fullname: mount.value,
          stat: {
            isDirectory: function() {
              return false
            }
          }
        });

        prototype.does(function loadFile() {});

        v.init().then(done).catch(done);

      }
    );

  });

  context('loadDirectory()', function() {

    it('lists the content of the directory and hands it down a chain of functions',

      function(done, fs, expect, Vertex, prototype, tree, mount) {

        fs.does(
          function readdirAsync(dir) {
            expect(dir).to.equal(mount.value);
          }
        );

        var order = [];
        var last = function(n) {
          order.push(n);
          expect(order).to.eql([1, 2]);
          done();
        }

        prototype.does(

          function createVertexInfo() { order.push(1); },
          function groupVertexTypes() { last(2); }

        );

        var v = new Vertex(tree, {route: [], fullname: mount.value});

        v.loadDirectory().then(done).catch(done);

      }
    );

  });

  context('createVertexInfo()', function() {

    it('stats each item in the promised directory listing AND...',

      // And creates a vertex config from each
      // And filters out items where stat errored

      function(done, fs, expect, Vertex, tree, mount) {

        var v = new Vertex(tree, {route: [], fullname: mount.value});

        var promise = {
          then: function(provide) {
            provide(['content', 'of', 'directory', 'with-a-file.js']);
            return {
              catch: function() {}
            }
          }
        }

        var createResultPromise = function(isDir, error) {
          return {
            then: function(handler) {
              if (!error) {
                handler({
                  isDirectory: function() { return isDir; }
                });
              }
              return {
                catch: function(handler) {
                  if (error) handler(error);
                }
              }
            }
          }
        }

        fs.does(
          function statAsync(filename) {
            expect(filename).to.equal(mount.value + '/content');
            return createResultPromise(true);
          },

          function statAsync(filename) {
            expect(filename).to.equal(mount.value + '/of');
            return createResultPromise(true, 'Error string');
          },

          function statAsync(filename) {
            expect(filename).to.equal(mount.value + '/directory');
            return createResultPromise(true);
          },

          function statAsync(filename) {
            expect(filename).to.equal(mount.value + '/with-a-file.js');
            return createResultPromise(false);
          }

        )

        v.createVertexInfo(promise)

        .then(function(vertexInfoList) {

          expect(
            vertexInfoList.map(function(vertexInfo) {
              return {
                name: vertexInfo.name,
                route: vertexInfo.route,
              }
            })
          )
          .to.eql([
            {name: 'content', route: ['content']},
            // {name: 'of', route: ['of']},        // not included, stat() errored
            {name: 'directory', route: ['directory']},
            {name: 'with-a-file.js', route: ['with-a-file']},
          ]);

        })

        .then(done).catch(done);

      }

    );

  });


  context('groupVertexTypes()', function() {

    it('groups the list of vertexes by type',

      function(done, fs, expect, Vertex, tree, mount) {

        var v = new Vertex(tree, {route: [], fullname: mount.value});

        var vertexInfo;

        var promise = {
          then: function(provide) {
            provide( vertexInfoList = [
              {
                name: 'dir1',
                stat: {
                  isDirectory: function() { return true; }
                }
              },
              {
                name: 'dir2',
                stat: {
                  isDirectory: function() { return true; }
                }
              },
              {
                name: 'something.else',
                stat: {
                  isDirectory: function() { return false; }
                }
              },
              {
                name: 'file1.js',
                stat: {
                  isDirectory: function() { return false; }
                }
              },
              {
                name: 'dir3',
                stat: {
                  isDirectory: function() { return true; }
                }
              },
              {
                name: 'file2.js',
                stat: {
                  isDirectory: function() { return false; }
                }
              },
            ]);
            return {
              catch: function() {}
            }
          }
        };

        v.groupVertexTypes(promise)

        .then(function(sets) {

          expect(sets.directory.map(function(info) {
            return info.name})
          ).to.eql(['dir1', 'dir2', 'dir3']);

          expect(sets.javascript.map(function(info) {
            return info.name})
          ).to.eql(['file1.js', 'file2.js']);

        })

        .then(done).catch(done);

    });

  });


    // it('creates an Edge and a new Vertex for each object in the directory',

    //   function(done, expect, tree, mount, fs, Vertex, Edge) {

    //     tree._meta.lazy = true; // don't recurse

    //     var edges = [];

    //     mock(Edge.prototype).spy(
    //       function init() {
    //         edges.push(this.name);
    //       }
    //     )

    //     var v = new Vertex(tree, {route: [], fullname: mount.value});

    //     v.assign(false);

    //     v.init()

    //     .then(function(vertex) {

    //       expect(edges).to.eql([ 'planets', 'sun', 'sun', 'planets', 'dwarf_planets' ]);
    //       expect(Object.keys(vertex._edges)).to.eql(['planets.js', 'sun.js', 'sun', 'planets', 'dwarf_planets']);
    //       expect(vertex._edges['planets'].right).to.be.an.instanceof(Vertex);
    //       expect(vertex._edges['sun'].right._info.stat.isCharacterDevice()).to.eql(false);

    //     })

    //     .then(done).catch(done);

    //   }

    // );

  // });

  xcontext('loadAsFile()', function() {

    it('merges the file content into the tree',

      function(done, tree, mount, path, Vertex, fs, fxt, expect) {

        tree.along = {
          this: {
            path: {
              through: {
                the: 'woods'
              }
            }
          }
        };

        mount.value = '/along/this/path/went.js';

        var v = new Vertex(tree, {route: ['along', 'this', 'path', 'went'], fullname: mount.value});


        fs.stub(
          // TODO: objective: readymade stub for require non-existant module
          function statSync(path) {
            if (path == '/along/this/path/went.js') {
              return mock.original.call(this, __filename);
            }
            return mock.original.apply(this, arguments);
          },
          function realpathSync(path) {
            return path;
          },
          function readFileSync(path) {
            if (path != '/along/this/path/went.js') {
              return mock.original.apply(this, arguments);
            }
            return fxt(function() {/*
              module.exports = {
                little: {
                  red:    9,
                  riding: 1,
                  hood:   9,
                }
              }
            */});
          }
        );

        var e = v.loadAsFile();

        if (e) return done(e);

        expect(tree.along).to.eql({
          this: {
            path: {
              through: {
                the: 'woods'
              },
              went: {
                little: {
                  red: 9,
                  riding: 1,
                  hood: 9,
                }
              }
            }
          }
        });

        done();

      }
    );

  });


});
