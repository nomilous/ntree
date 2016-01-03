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

    it('creates a property for tools', function(Tree, expect, Tools) {
      var opts = {};
      var tree = new Tree(opts);
      expect(tree._tools).to.be.an.instanceof(Tools);
      expect(tree._tools.tree).to.equal(tree);
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

    it('subscribes to $load for _assemble()', function(done, Tree, expect) {
      var opts = {};
      var tree = new Tree(opts);
      expect(tree._emitter._events['$load']).to.be.an.instanceof(Function);
      done();
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


});
