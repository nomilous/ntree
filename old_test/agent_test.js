objective('Agent', function() {

  before(function() {

    mock('expect', require('chai').expect);

    mock('tree', {
      _tools: {
        logger: {}
      },
      _meta: {
        scanInterval: 20
      }
    })

  });

  it('creates native type properties',

    function(expect, Vertex, Agent, tree) {

      v = new Vertex(tree, {route: []});

      object = {};

      var a = new Agent(v, 'num',  object, {num:  1}, []);
      var b = new Agent(v, 'str',  object, {str:  'string'}, []);
      var c = new Agent(v, 'bool', object, {bool: true}, []);

      expect(object).to.eql({
        bool: true,
        str: 'string',
        num: 1
      });

    }
  );

  it('creates function properties',

    function(expect, Vertex, Agent, tree) {

      v = new Vertex(tree, {route: []});

      object = {};

      var a = new Agent(v, 'fn',  object, {fn:  function() {return 1}}, []);

      expect(object.fn()).to.equal(1);

    }
  );

  it('attaches empty object if not native type and calls',

    function(done, expect, Vertex, Agent, tree) {

      v = new Vertex(tree, {route: []});

      object = {};

      var a = new Agent(v, 'deeper',  object, { deeper:  { value: 1 } }, []);

      expect(object).to.eql({
        deeper: {}
      });

      done();

    }
  );


  xit('sets unconfigurable properties',

    function(done, expect, Vertex, Agent, tree) {

      v = new Vertex(tree, {route: []});

      object = {};

      var a = new Agent(v, 'key',  object, { key: 'value 1' }, []);

      object.key = 'value 2';

      expect(object).to.eql({
        key: 'value 2'
      });

      try {

        Object.defineProperty(object, 'key', {
          value: 'value3'
        });

      } catch (e) {

        expect(e).to.match(/Cannot redefine property/);
        done();

      }

    }
  );

  context('activate() creates a watch that...', function() {

    beforeEach(function() {

      // instance of Agent

      var value = {}

      mock('instance', {
        name: 'KEY',
        getSync: function() {
          return value
        },
        setSync: function(v) {
          value = v;
        },
        // value: {},
        vertex: {
          _tree: {
            _meta: {
              scanInterval: 20
            }
          }
        }
      });

    });

    it('calls onCreatedKey() when a new property is appended',

      function(done, expect, instance, Agent) {

        Agent.prototype.activate.call(instance);

        mock(instance).does(function onCreatedKey(key) {

          expect(key).to.equal('NewKey');

          done();

        });

        instance.getSync().NewKey = 1;

      }
    );

    it('calls onDestroyedKey() when a property is removed',

      function(done, expect, instance, Agent) {

        instance.setSync({
          'House of Straw': {
            residents: ['first little pig']
          },
          'House of Sticks': {
            residents: ['second little pig']
          },
          'House of Bricks': {
            residents: ['second little pig']
          },
        })

        Agent.prototype.activate.call(instance);

        mock(instance).does(

          function onDestroyedKey(key) {
            expect(key).to.equal('House of Straw');
          },

          function onDestroyedKey(key) {
            expect(key).to.equal('House of Sticks');
            done();
          }

        );

        delete instance.getSync()['House of Straw'];
        delete instance.getSync()['House of Sticks'];

      }
    );

  });
  
  context('onCreatedKey()', function() {

    beforeEach(function() {

      mock('agent', {
        vertex: mock('vertex', {
          _tree: {
            _meta: {
              started: true
            }
          }
        })
      });

    })

    it('does not call changes while the tree is loading',

      function(done, vertex, agent, Agent) {

        vertex._tree._meta.started = false;

        vertex.spy(function onCreatedKey() {
          throw new Error('Should not do this.');
        });

        Agent.prototype.onCreatedKey.call(agent, 'key');
        done();

      }
    );

    it('calls vertex.onCreatedKey with the new key and detecting agent',

      function(done, expect, vertex, agent, Agent) {

        vertex.does(function onCreatedKey(key, detector) {

          expect(key).to.equal('key');
          expect(detector).to.equal(agent);
          done();

        });

        Agent.prototype.onCreatedKey.call(agent, 'key');

      }
    );

  });



  context('detecting changes', function() {

    it('raises change events on change of leaf value');

    it('raises change events on addition of leaf');

    it('raises change events on removal of leaf');

  });


});
