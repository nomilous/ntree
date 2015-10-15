objective('Vertex', function() {

  before(function(Vertex) {

    mock('prototype', Vertex.prototype);
    mock('expect', require('chai').expect);

    mock('promiseOf', function(data) {
      return {
        then: function(callback) {
          callback(data);
          return {
            catch: function() {}
          }
        }
      }
    });

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
      },
      _serializers: {
        '.js': {},
        '.i': {},
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
          expect(order).to.eql([1, 2, 3]);
          done();
        }

        prototype.does(

          function createVertexInfo() { order.push(1); },
          function groupVertexTypes() { order.push(2); },
          function attachVertexFiles() { last(3); }

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

      function(done, fs, expect, Vertex, tree, mount, promiseOf) {

        var v = new Vertex(tree, {route: [], fullname: mount.value});

        var directoryListing = ['content', 'of', 'directory', 'with-a-file.js'];

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

        v.createVertexInfo(promiseOf(directoryListing))

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

      function(done, fs, expect, Vertex, tree, mount, promiseOf) {

        var v = new Vertex(tree, {route: [], fullname: mount.value});

        var vertexInfoList = [
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
            name: 'info.i',
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
          }
        ];

        v.groupVertexTypes(promiseOf(vertexInfoList))

        .then(function(sets) {

          expect(sets.directory.map(function(info) {
            return info.name})
          ).to.eql(['dir1', 'dir2', 'dir3']);

          expect(sets.files['.js'].map(function(info) {
            return info.name})
          ).to.eql(['file1.js', 'file2.js']);

          expect(sets.files['.i'].map(function(info) {
            return info.name})
          ).to.eql(['info.i']);

        })

        .then(done).catch(done);

      }
    );

  });


  context('attachVertexFiles()', function() {

    it.only('creates edges and joins vertices to the tree',

      function(done, fs, expect, Vertex, Edge, tree, mount, promiseOf) {

        tree.branch = {};

        var v = new Vertex(tree, {route: ['branch'], fullname: mount.value});

        var sortedVertexInfo = {
          files: {
            '.js': [
              {
                route: ['branch', 'leaf1']
              },
              {
                route: ['branch', 'leaf2']
              }
            ]
          }
        }

        mock(Vertex.prototype).does(
          function loadFile() {},
          function loadFile() {}
        );

        mock(Edge.prototype).does(
          function link() {},
          function link() {}
        );

        v.attachVertexFiles(promiseOf(sortedVertexInfo))

        .then(function(result) {

          // console.log('RESULT', result);

        })

        .then(done).catch(done);

      }
    );

  });

});
