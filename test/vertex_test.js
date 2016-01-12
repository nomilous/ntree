objective('Vertex', function() {

  before(function(events) {
    mock('expect', require('chai').expect);
    mock('tree', {
      _opts: {},
      _emitter: new events.EventEmitter()
    })
  });

  context('constructor', function() {
    it('has reference to tree and key and source and vref', function(done, Vertex, tree, expect) {
      var vertex = new Vertex(tree, 'KEY', 'SOURCE', 'VREF');
      expect(vertex.tree).to.equal(tree);
      expect(vertex.key).to.equal('KEY');
      expect(vertex.sources).to.eql(['SOURCE']);
      expect(vertex.vref).to.equal('VREF');
      done();
    });

    it('has property to store whether or not vertex has file and/or directory associations',
      function(done, Vertex, tree, expect) {
        var vertex = new Vertex(tree, 'KEY', 'SOURCE', 'VREF');
        expect(vertex.hasDirectory).to.equal(null);
        expect(vertex.hasFile).to.equal(null);
        done();
    });

    it('has property to store value', function(done, Vertex, tree, expect) {
      var vertex = new Vertex(tree, 'KEY', 'SOURCE', 'VREF');
      expect(vertex.value).to.eql({});
      done();
    });

    it('creates an agent to monitor for new keys', function(done, Vertex, tree, Agent, expect) {
      tree._opts.agents = {
        xxx: 1
      }
      var vertex = new Vertex(tree, 'KEY', 'SOURCE', 'VREF');
      expect(vertex.agent).to.be.an.instanceof(Agent);
      expect(vertex.agent.vertex).to.equal(vertex);
      expect(vertex.agent.opts).to.equal(tree._opts.agents);
      done();
    });
  });

  context('loadSource()', function() {

    beforeEach(function(tree, SourceType, Vertex, Tools) {
      tree._tools = new Tools();
      tree.outer = {};
      var serializer = mock('serializer', {
        readSync: function() {}
      });
      var source = mock('source', {
        type: SourceType.FILE,
        serializer: serializer,
        route: []
      });
      var vref = mock('vref', {});
      var vertex = new Vertex(tree, 'KEY', source, vref);
      vref.__ = vertex
      mock('vertex', vertex);
      vertex.value = tree.outer;
      tree._vertices = {
        outer: vref
      };
    });

    it('calls readSync on the serializer for source', function(done, vertex, source, serializer, expect) {
      serializer.does(function readSync(vertex) {
        expect(vertex).to.equal(vertex);
      });
      vertex.loadSource(source, true);
      done();
    });

    it('builds the vertex and user subtrees from the source',
      function(done, vertex, source, tree, serializer, expect, Vertex) {
        serializer.does(function readSync(vertex) {
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
        vertex.loadSource(source, true);

        expect(tree._vertices.outer.__).to.be.an.instanceof(Vertex);
        expect(tree._vertices.outer.key1.__).to.be.an.instanceof(Vertex);
        expect(tree._vertices.outer.key2.__).to.be.an.instanceof(Vertex);
        expect(tree._vertices.outer.key3.__).to.be.an.instanceof(Vertex);
        expect(tree._vertices.outer.key4.__).to.be.an.instanceof(Vertex);
        expect(tree._vertices.outer.key5.__).to.be.an.instanceof(Vertex);
        expect(tree._vertices.outer.key5.deeper1.__).to.be.an.instanceof(Vertex);
        expect(tree._vertices.outer.key5.deeper2.__).to.be.an.instanceof(Vertex);

        expect(tree.outer.key1).to.equal(1);
        expect(tree.outer.key2).to.equal('two');
        expect(tree.outer.key3).to.equal(false);
        expect(tree.outer.key4()).to.equal(1);
        expect(tree.outer.key5.deeper1).to.eql({});
        expect(tree.outer.key5.deeper2).to.equal(true);
        done();
    });


  });

  context('unloadSource', function() {
    it('removes all reference to the key if the unloading source is the only source');
    it('when removing it sets detached and all children');
    it('removes the source from sources if more than on source');
  });


  context('getValue()', function() {

    it('returns vertex.value', function(done, Vertex, expect) {
      var vertex = {
        value: 1,
        tree: {
        }
      }
      expect(Vertex.prototype.getValue.call(vertex)).to.equal(1);
      done();
    });

  });

  context('setValue()', function() {

    it('');

  });

});
