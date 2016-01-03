objective('Tools', function() {

  before(function() {
    mock('expect', require('chai').expect);
  });

  context('constructor', function() {

    it('creates tree property from first arg', function(done, Tools, expect) {
      var tools = new Tools('TREE');
      expect(tools.tree).to.equal('TREE');
      done();
    });

  });

  context('readdirStatAsync()', function() {
    it('returns promise of dir content with stat for each', function(done, Tools, expect) {
      var tools = new Tools();
      tools.readdirStatAsync(__dirname).then(function(sources) {
        expect(sources[0].filename).to.exist;
        expect(sources[0].stat).to.exist;
        expect(sources[0].stat.isDirectory).to.be.an.instanceof(Function);
        done();
      }).catch(done);
    });
  });

  context('readdirRecurseAsync()', function() {
    it('recurses into directory emitting content with stat', function(done, Tools, events, expect) {
      var tools = new Tools();
      var emitter = new events.EventEmitter();
      var sources = [];
      emitter.on('$load', function(source) {
        sources.push(source);
      });
      tools.readdirRecurseAsync(emitter, __dirname).then(function() {
        expect(sources.length > 1).to.be.true;
        expect(sources[0].filename).to.exist;
        expect(sources[0].stat).to.exist;
        expect(sources[0].stat.isDirectory).to.be.an.instanceof(Function);
        done();
      }).catch(done);
    });
  });

});
