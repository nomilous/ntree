objective('Vertex', function() {

  before(function() {
    mock('expect', require('chai').expect);
  });

  context('constructor', function() {
    it('has reference to tree and source and vref', function(done, Vertex, expect) {
      var vertex = new Vertex('TREE', 'SOURCE', 'VREF');
      expect(vertex.tree).to.equal('TREE');
      expect(vertex.sources).to.eql(['SOURCE']);
      expect(vertex.vref).to.equal('VREF');
      done();
    });

    it('has property to store whether or not vertex has file and/or directory associations',
      function(done, Vertex, expect) {
        var vertex = new Vertex('TREE', 'SOURCE', 'VREF');
        expect(vertex.hasDirectory).to.equal(null);
        expect(vertex.hasFile).to.equal(null);
        done();
    });

    it('has property to store value', function(done, Vertex, expect) {
      var vertex = new Vertex('TREE', 'SOURCE', 'VREF');
      expect(vertex.value).to.equal(null);
      done();
    });
  });

  context('loadSource()', function() {

    beforeEach(function(SourceType, Vertex, Tools) {
      var tree = mock('tree', {
        _tools: new Tools(),
        outer: {}
      });
      var serializer = mock('serializer', {
        readSync: function() {}
      });
      var source = mock('source', {
        type: SourceType.FILE,
        serializer: serializer
      });
      var vref = mock('vref', {});
      var vertex = new Vertex(tree, source, vref);
      vref.__ = vertex
      mock('vertex', vertex);
      vertex.value = tree.outer;
      tree._vertices = {
        outer: vref
      };
    });

    it('calls readSync on the serializer for source', function(done, vertex, serializer, expect) {
      serializer.does(function readSync(vertex) {
        expect(vertex).to.equal(vertex);
      });
      vertex.loadSource();
      done();
    });

    it('builds the vertex and user subtrees from the source',
      function(done, vertex, tree, serializer, expect, Vertex) {
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
        vertex.loadSource();

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


  context('getValue()', function() {

    it('');

  });

  context('setValue()', function() {

    it('');

  });

});
