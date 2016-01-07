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

  context('diffKeys()', function() {

    beforeEach(function(Tools) {
      mock('tools', new Tools());
      mock('old', {
        one: 1,
        two: 2,
        three: 3,
        four: 4,
        five: 5
      });
      mock('nue', {
        one: 1,
        two: 2,
        three: 3,
        four: 4,
        five: 5
      });
    })

    // it('returns array of new keys', function(done, tools, expect) {
    //   var old = {};
    //   var nue = {
    //     key1: {},
    //     key2: {}
    //   }
    //   var change = tools.diffKeys(Object.keys(old), Object.keys(nue));
    //   expect(change.keys).to.eql(['key1', 'key2']);
    //   done();
    // });

    it('detects single first key removed', function(done, tools, old, nue, expect) {
      delete nue.one;
      var change = tools.diffKeys(Object.keys(old), Object.keys(nue));
      expect(change.removed).to.eql(['one']);
      done();
    });

    it('detects multiple first key removed', function(done, tools, old, nue, expect) {
      delete nue.one;
      delete nue.two;
      var change = tools.diffKeys(Object.keys(old), Object.keys(nue));
      expect(change.removed).to.eql(['one', 'two']);
      done();
    });

    it('detects single first key replaced', function(done, tools, old, nue, expect) {
      delete nue.one;
      nue.one = 1;
      var change = tools.diffKeys(Object.keys(old), Object.keys(nue));
      expect(change.removed).to.eql(['one']);
      expect(change.added).to.eql(['one']);
      done();
    });

    it('detects multiple first key replaced', function(done, tools, old, nue, expect) {
      delete nue.one;
      delete nue.two;
      nue.one = 1;
      nue.two = 1;
      var change = tools.diffKeys(Object.keys(old), Object.keys(nue));
      expect(change.removed).to.eql(['one', 'two']);
      expect(change.added).to.eql(['one', 'two']);
      done();
    });


    it('detects single middle key removed', function(done, tools, old, nue, expect) {
      delete nue.three;
      var change = tools.diffKeys(Object.keys(old), Object.keys(nue));
      expect(change.removed).to.eql(['three']);
      // expect(change.added).to.eql([]);
      done();
    });

    it('detects single middle key replaced', function(done, tools, old, nue, expect) {
      delete nue.three;
      nue.three = 3;
      var change = tools.diffKeys(Object.keys(old), Object.keys(nue));
      expect(change.removed).to.eql(['three']);
      expect(change.added).to.eql(['three']);
      done();
    });

    it('detects multiple middle key removed', function(done, tools, old, nue, expect) {
      delete nue.two;
      delete nue.four;
      var change = tools.diffKeys(Object.keys(old), Object.keys(nue));
      expect(change.removed).to.eql(['two', 'four']);
      done();
    });

    it('detects multiple middle key replaced', function(done, tools, old, nue, expect) {
      delete nue.two;
      delete nue.four;
      nue.two = 2;
      nue.four = 4;
      var change = tools.diffKeys(Object.keys(old), Object.keys(nue));
      expect(change.removed).to.eql(['two', 'four']);
      expect(change.added).to.eql(['two', 'four']);
      done();
    });

    it('detects single last key removed', function(done, tools, old, nue, expect) {
      delete nue.five;
      var change = tools.diffKeys(Object.keys(old), Object.keys(nue));
      expect(change.removed).to.eql(['five']);
      done();
    });

    xit('detects single last key replaced', function(done, tools, old, nue, expect) {
      delete nue.five;
      nue.five = 5
      var change = tools.diffKeys(Object.keys(old), Object.keys(nue));
      expect(change.removed).to.eql(['five']);
      expect(change.added).to.eql(['five']);
      done();
    });

    it('detects multiple last key removed', function(done, tools, old, nue, expect) {
      delete nue.five;
      delete nue.four;
      var change = tools.diffKeys(Object.keys(old), Object.keys(nue));
      expect(change.removed).to.eql(['four', 'five']);
      done();
    });

    xit('detects multiple last key replaced');

    it('detects single new key', function(done, tools, old, nue, expect) {
      nue.six = 6
      var change = tools.diffKeys(Object.keys(old), Object.keys(nue));
      expect(change.added).to.eql(['six']);
      done();
    });

    it('detects multiple new key', function(done, tools, old, nue, expect) {
      nue.six = 6;
      nue.seven = 7;
      var change = tools.diffKeys(Object.keys(old), Object.keys(nue));
      expect(change.added).to.eql(['six', 'seven']);
      done();
    });

    it('detects first key', function(done, tools, old, nue, expect) {
      var change = tools.diffKeys(Object.keys({}), Object.keys({one: 1}));
      expect(change.added).to.eql(['one']);
      done();
    })

    it('detects all keys removed', function(done, tools, old, nue, expect) {
      delete nue.one;
      delete nue.two;
      delete nue.three;
      delete nue.four;
      delete nue.five;
      var change = tools.diffKeys(Object.keys(old), Object.keys(nue));
      expect(change.removed).to.eql(['one', 'two', 'three', 'four', 'five']);
      done();
    });

    xit('detects all keys replaced');

  });

  context('conditionalDelete()', function() {

    it('removes specific elements from array', function(done, Tools, expect) {
      var tools = new Tools();
      var array = [{n:1, x:true}, {n:2, x:false}, {n:3, x:false}, {n:4, x:true}];
      var comparator = function(a) {
        return a.x
      };
      tools.conditionalDelete(array, comparator);
      expect(array).to.eql([
        {n:2, x:false},
        {n:3, x:false}
      ]);
      done();
    });

  });

});
