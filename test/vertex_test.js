objective('Vertex', function() {

  before(function() {
    mock('expect', require('chai').expect);
  });

  context('constructor', function() {
    it('has reference to tree and source and vref', function(done, Vertex, expect) {
      var vertex = new Vertex('TREE', 'SOURCE', 'VREF');
      expect(vertex.tree).to.equal('TREE');
      expect(vertex.source).to.equal('SOURCE');
      expect(vertex.vref).to.equal('VREF');
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
