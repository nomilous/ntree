objective('Tree', function() {

  before(function() {
    mock('expect', require('chai').expect);
  });

  context('constructor', function() {

    it('has no enumerable properties', function(expect, Tree) {
      var opts = {
        mount: 'dir'
      };
      var tree = new Tree(opts);
      expect(Object.keys(tree)).to.eql([]);

    })

    it('creates a property for opts with some defaults', function(Tree, expect) {
      var opts = {
        mount: 'dir/deeper/'
      };
      var tree = new Tree(opts);
      expect(tree._opts).to.equal(opts);

      expect(tree._opts.mount).to.equal('dir/deeper'); // without last /
      expect(tree._opts.syncIn).to.equal(true);
      expect(tree._opts.syncOut).to.equal(true);
      expect(tree._opts.watcher.followSymlinks).to.equal(false);
      expect(tree._opts.agents.scanInterval).to.equal(20);
    });

    it('creates sourceMask regex for stripping absolute paths to treePath', function(Tree, expect) {
      var opts = {
        mount: 'dir'
      };
      var tree = new Tree(opts);
      expect(tree._opts.sourceMask).to.be.an.instanceof(RegExp);
    });

    it('creates a property for sources', function(Tree, expect) {
      var opts = {
        mount: 'dir'
      };
      var tree = new Tree(opts);
      expect(tree._sources).to.eql({});
    });

    it('creates a property for vertices', function(Tree, expect) {
      var opts = {
        mount: 'dir'
      };
      var tree = new Tree(opts);
      expect(tree._vertices).to.eql({});
    });

    it('creates a property for serializers and registers defaults', function(done, Tree, Javascript, Directory, expect) {
      var opts = {
        mount: 'dir'
      };
      var tree = new Tree(opts);
      expect(tree._serializers['.js']).to.be.an.instanceof(Javascript);
      expect(tree._serializers['.directory']).to.be.an.instanceof(Directory);
      done();
    });

    it('creates a property to house the event emitter', function(done, Tree, expect, events) {
      var opts = {
        mount: 'dir'
      };
      var tree = new Tree(opts);
      expect(tree._emitter).to.be.an.instanceof(events.EventEmitter);
      done();
    });

    it('creates functions for event subscriptions', function(done, Tree, expect, events) {
      var opts = {
        mount: 'dir'
      };
      var tree = new Tree(opts);
      var event1 = 0, event2 = 0;
      tree.on('event1', function() { event1++; });
      tree.once('event2', function() { event2++; });
      tree._emitter.emit('event1');
      tree._emitter.emit('event1');
      tree._emitter.emit('event2');
      tree._emitter.emit('event2');
      expect(event1).to.equal(2);
      expect(event2).to.equal(1);
      done();
    });

    // it('subscribes _attachSource() to $load for _start()', function(done, Tree, expect) {
    //   var opts = {};
    //   mock(Tree.prototype).does(function _attachSource(source) {
    //     expect(source).to.equal('SOURCE');
    //     done();
    //   });
    //   var tree = new Tree(opts);
    //   expect(tree._emitter._events['$load']).to.be.an.instanceof(Function);
    //   tree._emitter.emit('$load', 'SOURCE');
    // });

  });

  context('registerSerializer()', function() {
    it('registers serializers (can decode or encode to storage)', function(done, Tree, expect) {
      var opts = {
        mount: 'dir'
      };
      var tree = new Tree(opts);
      tree.registerSerializer({
        extensions: ['.ldb'],
        definition: 'of it'
      });
      expect(tree._serializers['.ldb'].definition).to.equal('of it');
      done();
    });
  });

  context('_start()', function() {
    xit('loads the tree by passing the emitter into the recursor', function(done, Tree, expect) {
      var opts = {mount: __dirname};
      var tree = new Tree(opts);
      mock(tree._tools).spy(function readdirRecurseAsync(emitter, filename) {
        expect(emitter).to.equal(tree._emitter);
        expect(filename).to.equal(__dirname);
      })
      tree._start().then(done).catch(done);
    });
  });

  context('_attachSource()', function() {

    beforeEach(function(Tree) {
      mock('tree', new Tree({mount: '/path/to/tree'}));
      mock('sourceDir', {
        filename: '/path/to/tree/branch/leaf',
        stat: {
          isDirectory: function() {
            return true;
          }
        }
      });
      mock('sourceFile', {
        filename: '/path/to/tree/branch/leaf.js',
        stat: {
          isDirectory: function() {
            return false;
          }
        }
      });
    });

    it('directs ammended source to _attachDirectory()', function(done, tree, sourceDir, expect) {
      tree.does(function _attachDirectory(source) {
        expect(source.filePath).to.equal('branch/leaf');
        expect(source.treePath).to.equal('branch/leaf');
        done();
      });
      tree._attachSource(sourceDir);
    });

    it('directs ammended source to _attachFile()', function(done, tree, sourceFile, expect) {
      tree.does(function _attachFile(source) {
        expect(source.filePath).to.equal('branch/leaf.js');
        expect(source.treePath).to.equal('branch/leaf');
        expect(source.ext).to.equal('.js');
        expect(source.serializer).to.equal(tree._serializers['.js']);
        done();
      });
      tree._attachSource(sourceFile);
    });

  });

  context('_attachDirectory()', function() {

    beforeEach(function(Tree, SourceType) {
      mock('tree', new Tree({mount: '/path/to/tree'}));
      mock('sourceDir', {
        type: SourceType.DIRECTORY,
        filename: '/path/to/tree/branch/leaf',
        filePath: 'branch/leaf',
        treePath: 'branch/leaf',
        stat: {
          isDirectory: function() {
            return true;
          }
        }
      });
    });

    it('attaches root source and vertex if source is root', function(done, tree, sourceDir, expect) {
      sourceDir.root = true;
      sourceDir.filePath = '';
      sourceDir.treePath = '';
      tree._attachDirectory(sourceDir);
      expect(tree._sources['']).to.equal(sourceDir);
      expect(tree._vertices.__).to.exist;
      expect(tree._vertices.__.sources[0]).to.equal(sourceDir);
      done();
    });

    it('attaches tree reference to source and creates type and route',
      function(done, tree, sourceDir, expect, Tools, SourceType) {
        mock(Tools.prototype).stub(function getNested(){
          return {
            __: {
              sources: []
            }
          };
        });
        tree._attachDirectory(sourceDir);
        expect(tree._sources['branch/leaf']).to.equal(sourceDir);
        expect(sourceDir.type).to.equal(SourceType.DIRECTORY);
        expect(sourceDir.route).to.eql(['branch', 'leaf']);
        done();
    });

    context('with root key', function() {

      it('attaches a Vertex to the tree', function(done, tree, sourceDir, expect, Vertex) {
        // make route root, (normally branch would already exist by the time brach/leaf is added)
        sourceDir.filePath = 'branch';
        sourceDir.treePath = 'branch';
        tree._attachDirectory(sourceDir);
        expect(tree._vertices.branch).to.exist;
        expect(tree._vertices.branch.__).to.be.an.instanceof(Vertex);
        expect(tree._vertices.branch.__.hasDirectory).to.be.true;
        done();
      });

      it('attaches the key to the user tree referencing the Vertex', function(done, tree, sourceDir, Tools, expect) {
        // make route root, (normally branch would already exist by the time brach/leaf is added)
        sourceDir.filePath = 'branch';
        sourceDir.treePath = 'branch';
        tree._attachDirectory(sourceDir);
        expect(tree.branch).to.exist;
        done();
      });

    });

    context('with nested key', function() {

      beforeEach(function(tree) {
        tree.branch = {};
        tree._vertices.branch = {};
      });

      it('attaches a Vertex to the tree', function(done, tree, sourceDir, expect, Vertex) {
        // make route root, (normally branch would already exist by the time brach/leaf is added)
        sourceDir.filePath = 'branch/leaf';
        sourceDir.treePath = 'branch/leaf';
        tree._attachDirectory(sourceDir);
        expect(tree._vertices.branch.leaf).to.exist;
        expect(tree._vertices.branch.leaf.__).to.be.an.instanceof(Vertex);
        expect(tree._vertices.branch.leaf.__.hasDirectory).to.be.true;
        done();
      });

      it('attaches the key to the user tree referencing the Vertex', function(done, tree, sourceDir, Tools, expect) {
        // make route root, (normally branch would already exist by the time brach/leaf is added)
        sourceDir.filePath = 'branch/leaf';
        sourceDir.treePath = 'branch/leaf';
        tree._attachDirectory(sourceDir);
        expect(tree.branch.leaf).to.exist;
        done();
      });

    });

  });

  context('_attachFile()', function() {

    beforeEach(function(Tree, SourceType, Agent) {
      mock('tree', new Tree({mount: '/path/to/tree'}));
      mock('sourceFile', {
        type: SourceType.FILE,
        filename: '/path/to/tree/branch/leaf.js',
        filePath: 'branch/leaf.js',
        treePath: 'branch/leaf',
        stat: {
          isDirectory: function() {
            return false;
          }
        }
      });
    });

    it('attaches root source and vertex if source is root', function(done, tree, sourceFile, expect) {
      sourceFile.root = true;
      sourceFile.filePath = '';
      sourceFile.treePath = '';
      sourceFile.serializer = {
        readSync: function() {}
      }
      tree._attachFile(sourceFile);
      expect(tree._sources['']).to.equal(sourceFile);
      expect(tree._vertices.__).to.exist;
      expect(tree._vertices.__.sources[0]).to.equal(sourceFile);
      done();
    });

    it('attaches tree reference to source and creates type and route',
      function(done, tree, sourceFile, expect, SourceType, Tools) {
        mock(Tools.prototype).stub(function getNested(){
          return {
            __: {
              sources: [],
              loadSource: function() {}
            }
          };
        });
        tree._attachFile(sourceFile);
        expect(tree._sources['branch/leaf.js']).to.equal(sourceFile);
        expect(sourceFile.type).to.equal(SourceType.FILE);
        expect(sourceFile.route).to.eql(['branch', 'leaf']);
        done();
    });

    context('with root key', function() {

      it('calls vertex.loadSource on the new vertex and attached to vertices and tree',
        function(done, tree, sourceFile, expect, Vertex) {
          sourceFile.filePath = 'branch';
          sourceFile.treePath = 'branch';
          sourceFile.loading = true;
          mock(Vertex.prototype).does(function loadSource(source, loading) {
            expect(loading).to.be.true;
          })
          tree._attachFile(sourceFile);

          expect(tree._vertices.branch).to.exist;
          expect(tree._vertices.branch.__).to.be.an.instanceof(Vertex);
          expect(tree._vertices.branch.__.hasFile).to.be.true;
          // expect(tree.branch).to.exist; // not yet
          done();
        }
      );

      it('builds file content onto tree', function(done, tree, sourceFile, expect) {
        mock(sourceFile.serializer = {}).does(function readSync(vertex) {
          return {
            key1: 1,
            key2: 'two',
            key3: false,
            key4: function() {
              return 1
            },
            key5: {
              deeper1: {},
              deeper2: true
            },
            // key6: ['a', 'r', 'r', 'a', 'y'],
            // key7: new Buffer('dddd'),
            // key8: new RegExp,
            // key9: new Date,
          }
        });
        sourceFile.filePath = 'branch';
        sourceFile.treePath = 'branch';
        tree._attachFile(sourceFile);

        expect(tree.branch.key1).to.equal(1);
        expect(tree.branch.key2).to.equal('two');
        expect(tree.branch.key3).to.equal(false);
        expect(tree.branch.key4()).to.equal(1);
        expect(tree.branch.key5.deeper1).to.eql({});
        expect(tree.branch.key5.deeper2).to.equal(true);

        expect(tree._vertices.branch.key1.__.sources[0]).to.equal(sourceFile);
        expect(tree._vertices.branch.key5.deeper1.__.sources[0]).to.equal(sourceFile);
        done();
      });

      xit('ammends when existing Vertex at same location', function(done, tree, sourceFile, expect) {
        mock(sourceFile.serializer = {}).does(
          function readSync(vertex) {
            return {
              key1: 1
            }
          },
          function readSync(vertex) {
            return {
              key1: 1
            }
          }
        );

        sourceFile.filePath = 'branch';
        sourceFile.treePath = 'branch';

        tree._attachFile(sourceFile);
        expect(tree._vertices.branch.key1.__.sources.length).to.equal(1);

        tree._attachFile(sourceFile);
        expect(tree._vertices.branch.key1.__.sources.length).to.equal(2);
        done();
      });

    });

  });

  context('_detachSource()', function() {

    beforeEach(function(SourceType) {
      mock('tree', {
        _sources: {
          'the/directory': {
            type: SourceType.DIRECTORY
          },
          'the/file.js': {
            type: SourceType.FILE
          }
        },
        _opts: {
          sourceMask: new RegExp("^" + '/root/')
        },
        _emitter: mock('emitter')
      })
    });

    it('directs according to original source type', function(done, Tree, tree, emitter, expect) {
      var dir = tree._sources['the/directory'];
      var file = tree._sources['the/file.js'];
      mock(tree).does(
        function _detachDirectory(source) {
          expect(source).to.equal(dir);
        },
        function _detachFile(source) {
          expect(source).to.equal(file);
        }  
      );
      // emitter.does(
      //   function emit(event, data) {
      //     expect(event).to.equal('$patch');
      //     // TODO: untested patch
      //     expect(data).to.eql({
      //       doc: undefined,
      //       patch: []
      //     });
      //   },
      //   function emit(event, data) {
      //     expect(event).to.equal('$patch');
      //     expect(data).to.eql({
      //       doc: undefined,
      //       patch: []
      //     });
      //   }
      // )
      Tree.prototype._detachSource.call(tree, {
        filename: '/root/the/directory'
      });
      Tree.prototype._detachSource.call(tree, {
        filename: '/root/the/file.js'
      });
      done();
    });

  });

  context('_detachDirectory()', function() {
    xit('')
  });

  context('_detachFile()', function() {
    xit('')
  });

  context('_activate()', function() {
    it('is called on ready watcher', function(done, Tree, chokidar) {
      chokidar.does(function watch() {
        return {
          on: function(event, handler) {
            
          },
          once: function(event, handler) {
            if (event === 'ready') handler();
          }
        }
      });
      mock(Tree.prototype).does(function _activate() {});
      var tree = new Tree({
        mount: 'dir'
      });
      tree._start();
      done();
    });
    it('starts the scanner interval calling into agents', function(done, Tree, bluebird, expect) {
      var tree = {
        mount: 'dir',
        _opts: {
          agents: {
            scanInterval: 20
          }
        },
        _vertices: {
          __: {
            agent: {
              scan: function(token) {
                expect(token.vertices).to.equal(0);
                clearInterval(tree._scanner);
                done();
                return new bluebird(function() {});
              }
            }
          }
        }
      }
      Tree.prototype._activate.call(tree);
    });
  })

  xit('can be stopped cleanly', function() {
    // syncIn, syncOut false, delete
  });

  xit('collides on neptune?')

});
