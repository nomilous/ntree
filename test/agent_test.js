objective('Agent', function() {

  before(function() {
    mock('expect', require('chai').expect);
  });

  beforeEach(function(events) {
    mock('vertex', {
      tree: {
        _opts: {

        },
        _emitter: new events.EventEmitter
      }
    });
  });
  
  context('constructor', function() {

    it('has reference to the Vertex it monitors', function(done, Agent, vertex, expect) {
        vertex.tree._opts.agents = {x: 1};
        var agent = new Agent(vertex);
        expect(agent.vertex).to.equal(vertex);
        expect(agent.opts).to.eql({x: 1});
        done();
    });

  });

});
