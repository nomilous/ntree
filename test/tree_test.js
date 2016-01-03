objective('Tree', function() {

  before(function() {
    mock('expect', require('chai').expect);
  });

  context('constructor', function() {

    it('has no enumerable properties', function(expect, Tree) {
      var opts = {};
      var tree = new Tree(opts);
      expect(Object.keys(tree)).to.eql([]);

    })

    it('creates a property for opts', function(Tree, expect) {
      var opts = {};
      var tree = new Tree(opts);
      expect(tree._opts).to.equal(opts);
    });

    it('creates sourceMask regex for stripping absolute paths to treePath', function(Tree, expect) {
      var opts = {};
      var tree = new Tree(opts);
      expect(tree._opts.sourceMask).to.be.an.instanceof(RegExp);
    });

    it('creates a property for tools', function(Tree, expect, Tools) {
      var opts = {};
      var tree = new Tree(opts);
      expect(tree._tools).to.be.an.instanceof(Tools);
      expect(tree._tools.tree).to.equal(tree);
    });

    it('creates a property for sources', function(Tree, expect) {
      var opts = {};
      var tree = new Tree(opts);
      expect(tree._sources).to.eql({});
    });

    it('creates a property for vertices', function(Tree, expect) {
      var opts = {};
      var tree = new Tree(opts);
      expect(tree._vertices).to.eql({});
    });

    it('creates a property for serializers and registers defaults', function(done, Tree, Javascript, Directory, expect) {
      var opts = {};
      var tree = new Tree(opts);
      expect(tree._serializers['.js']).to.be.an.instanceof(Javascript);
      expect(tree._serializers['.directory']).to.be.an.instanceof(Directory);
      done();
    });

    it('creates a property to house the event emitter', function(done, Tree, expect, events) {
      var opts = {};
      var tree = new Tree(opts);
      expect(tree._emitter).to.be.an.instanceof(events.EventEmitter);
      done();
    });

    it('creates functions for event subscriptions', function(done, Tree, expect, events) {
      var opts = {};
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

    it('subscribes _attachSource() to $load for _assemble()', function(done, Tree, expect) {
      var opts = {};
      mock(Tree.prototype).does(function _attachSource(source) {
        expect(source).to.equal('SOURCE');
        done();
      });
      var tree = new Tree(opts);
      expect(tree._emitter._events['$load']).to.be.an.instanceof(Function);
      tree._emitter.emit('$load', 'SOURCE');
    });

  });

  context('registerSerializer()', function() {
    it('registers serializers (can decode or encode to storage)', function(done, Tree, expect) {
      var opts = {};
      var tree = new Tree(opts);
      tree.registerSerializer({
        extensions: ['.ldb'],
        definition: 'of it'
      });
      expect(tree._serializers['.ldb'].definition).to.equal('of it');
      done();
    });
  });

  context('_assemble()', function() {
    it('loads the tree by passing the emitter into the recursor', function(done, Tree, expect) {
      var opts = {mount: __dirname};
      var tree = new Tree(opts);
      mock(tree._tools).spy(function readdirRecurseAsync(emitter, filename) {
        expect(emitter).to.equal(tree._emitter);
        expect(filename).to.equal(__dirname);
      })
      tree._assemble().then(done).catch(done);
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

    beforeEach(function(Tree) {
      mock('tree', new Tree({mount: '/path/to/tree'}));
      mock('sourceDir', {
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

    it('attaches tree reference to source and creates type and route', function(done, tree, sourceDir, expect, Tools) {
      mock(Tools.prototype).stub(function getNested(){
        return {};
      });
      tree._attachDirectory(sourceDir);
      expect(tree._sources['branch/leaf']).to.equal(sourceDir);
      expect(sourceDir.type).to.equal('fs/dir');
      expect(sourceDir.route).to.eql(['branch', 'leaf']);
      done();
    });

    context('root key', function() {

      it('attaches a Vertex to the tree', function(done, tree, sourceDir, expect, Vertex) {
        // make route root, (normally branch would already exist by the time brach/leaf is added)
        sourceDir.filePath = 'branch';
        sourceDir.treePath = 'branch';
        tree._attachDirectory(sourceDir);
        expect(tree._vertices.branch).to.exist;
        expect(tree._vertices.branch.__).to.be.an.instanceof(Vertex);
        done();
      });

      it('attaches the key to the tree referencing the Vertex', function(done, tree, sourceDir, expect) {
        // make route root, (normally branch would already exist by the time brach/leaf is added)
        sourceDir.filePath = 'branch';
        sourceDir.treePath = 'branch';
        tree._attachDirectory(sourceDir);
        expect(tree.branch).to.exist;
        done();
      });

    });

    context('nested key', function() {

      it('')

    });

  });

  context('_attachFile()', function() {

    beforeEach(function(Tree) {
      mock('tree', new Tree({mount: '/path/to/tree'}));
      mock('sourceFile', {
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

    it('attaches tree reference to source and creates type and route', function(done, tree, sourceFile, expect) {
      tree._attachFile(sourceFile);
      expect(tree._sources['branch/leaf.js']).to.equal(sourceFile);
      expect(sourceFile.type).to.equal('fs/file');
      expect(sourceFile.route).to.eql(['branch', 'leaf']);
      done();
    });

    context('root key', function() {

      xit('attaches multiple vertices to the tree (if file defines multiple keys)',
        function(done) {
        }
      );

    });

    context('nested key', function() {

      it('');

    });

  });

});
