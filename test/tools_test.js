objective('Tools', function() {

  before(function() {
    mock('expect', require('chai').expect);
  });

  context('constructor', function() {
    xit('creates tree property from first arg', function(done, Tools, expect) {
      var tools = new Tools('TREE');
      expect(tools.tree).to.equal('TREE');
      done();
    });
  });

  // context('readdirStatAsync()', function() {
  //   it('returns promise of dir content with stat for each', function(done, Tools, expect) {
  //     var tools = new Tools();
  //     tools.readdirStatAsync(__dirname).then(function(sources) {
  //       expect(sources[0].filename).to.exist;
  //       expect(sources[0].stat).to.exist;
  //       expect(sources[0].stat.isDirectory).to.be.an.instanceof(Function);
  //       done();
  //     }).catch(done);
  //   });
  // });

  // context('readdirRecurseAsync()', function() {
  //   it('recurses into directory emitting content with stat', function(done, Tools, events, expect) {
  //     var tools = new Tools();
  //     var emitter = new events.EventEmitter();
  //     var sources = [];
  //     emitter.on('$load', function(source) {
  //       sources.push(source);
  //     });
  //     tools.readdirRecurseAsync(emitter, __dirname).then(function() {
  //       expect(sources.length > 1).to.be.true;
  //       expect(sources[0].filename).to.exist;
  //       expect(sources[0].stat).to.exist;
  //       expect(sources[0].stat.isDirectory).to.be.an.instanceof(Function);
  //       done();
  //     }).catch(done);
  //   });
  // });

  context('getNested()', function() {
    it('retrieves object from given route in tree', function(done, Tools, expect) {
      var tools = new Tools();
      var tree = {
        outer: {
          nested: {
            value: 1
          }
        }
      }
      var route = ['outer', 'nested', 'value'];
      expect(tools.getNested(route, tree)).to.equal(1);
      done();
    });

    it('thows if the route does not exist', function(done, Tools, expect) {
      var tools = new Tools();
      var tree = {
        outer: {}
      }
      var route = ['outer', 'nested', 'value'];
      try {
        tools.getNested(route, tree)
      } catch (e) {
        expect(e.message).to.equal('getNested() missing route: outer/nested/value');
        done();
      }
    });

    it('does not throw if the last key is missing', function(done, Tools, expect) {
      var tools = new Tools();
      var tree = {
        outer: {
          nested: {
            
          }
        }
      }
      var route = ['outer', 'nested', 'value'];
      expect(tools.getNested(route, tree)).to.equal(undefined);
      done();
    })
  });

  context('setNested()', function() {
    it('sets a value at route in tree', function(done, Tools, expect) {
      var tools = new Tools();
      var tree = {
        outer: {
          nested: {
            
          }
        }
      }
      var route = ['outer', 'nested', 'value'];
      tools.setNested(route, tree, 'VALUE');
      expect(tree.outer.nested.value).to.equal('VALUE');
      done();
    });

    it('throws if parent is missing', function(done, Tools, expect) {
      var tools = new Tools();
      var tree = {
        outer: {
          
        }
      }
      var route = ['outer', 'nested', 'value'];
      try {
        tools.setNested(route, tree, 'VALUE');
      } catch (e) {
        expect(e.message).to.equal('setNested() missing route: outer/nested/value');
        done();
      }
    });
  });

  context('setPropertyNested()', function() {
    it('creates a property at route in tree referencing vertex', function(done, Tools, expect) {
      var tools = new Tools();
      var tree = {
        outer: {
          nested: {
          }
        }
      }
      var route = ['outer', 'nested', 'value'];
      var vertex = mock({}).does(
        function getValue() {
          return 919;
        },
        function setValue(v) {
          expect(v).to.equal(919);
          done();
        }
      )
      tools.setPropertyNested(route, tree, vertex);
      expect(tree.outer.nested.value).to.equal(919);
      tree.outer.nested.value = 919;
    });
  });

});
