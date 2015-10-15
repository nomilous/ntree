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

    it('creates edges and joins file vertices to the tree',

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


  context('loadFile()', function() {

    it('reads/decodes through the vertex\'s serializer and assembles the result',

      function(done, expect, Vertex) {

        var vertexInfo = {
          route: [],
          name: 'NAME',
          serializer: {
            decode: function(vertex) {
              expect(vertex._info.name).to.equal('NAME');
              return 'CONTENT';
            }
          }
        }

        var v = new Vertex({}, vertexInfo);

        mock(Vertex.prototype).does(
          function assemble(content) {
            expect(content).to.equal('CONTENT');
            done(); 
          }
        )

        v.loadFile();

      }

    );


  });


  context('assemble()', function() {

    it.only('attaches directly to pointer if content is a native type',

      function(expect, Vertex) {

        var vertexInfo = {
          route: [],
          // name: 'NAME',
        }

        var v1 = new Vertex({}, vertexInfo);
        v1.assemble(1);

        var v2 = new Vertex({}, vertexInfo);
        v2.assemble('two');

        var v3 = new Vertex({}, vertexInfo);
        v3.assemble(false);

        expect([
          v1._pointer,
          v2._pointer,
          v3._pointer
        ]).to.eql([1, 'two', false])

      }
    );


    it.only('recurses object content and define()s onto tree',

      function(expect, Vertex) {

        var vertexInfo = {
          route: ['starting', 'route'],
          // name: 'NAME',
        }

        var tree = {
          starting: {
            route: {

            }
          }
        }

        var v = new Vertex(tree, vertexInfo);

        mock(Vertex.prototype).does(

          function define(locus, object, value, route) {
            expect(route).to.eql(['starting', 'route', 'an']);
          },

          function define(locus, object, value, route) {
            expect(route).to.eql(['starting', 'route', 'which']);
          },

          function define(locus, object, value, route) {
            expect(route).to.eql(['starting', 'route', 'which', 'has']);
            expect(value.has).to.equal('a bit more');
          },

          function define(locus, object, value, route) {
            expect(route).to.eql(['starting', 'route', 'which', 'complexity']);
            expect(value.complexity).to.equal(true);
          },

          function define(locus, object, value, route) {
            expect(route).to.eql(['starting', 'route', 'like']);
            expect(value.like).to.equal(0);
          }

        );

        v.assemble({
          an: 'object',
          which: {
            has: 'a bit more',
            complexity: true,
          },
          like: 0
        });

      }
    );

    it('supports Array');

    it('supports Date');

    it('supports RegExp');

    it('supports Buffer');

  });


  context('define()', function() {

    it('recurses the loading content and defines it into the tree',

      function(done) {

      }
    );

  });


  context('assemble()', function() {

    it('recurses the loading content and attaches it to the tree',

      function(done) {

      }
    );

  });


  context('attachVertexDirectories()', function() {

    it('creates edges and joins directory vertices to the tree',

      function(done) {

      }
    );

  });

});
