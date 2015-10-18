objective('Agent', function() {

  before(function() {

    mock('expect', require('chai').expect);

    mock('tree', {
      _tools: {
        logger: {}
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

  it('attaches empty object if not native type and calls watchKey',

    function(done, expect, Vertex, Agent, tree) {

      v = new Vertex(tree, {route: []});

      object = {};

      mock(Agent.prototype).does(function watchKey() {

        expect(object).to.eql({
          deeper: {}
        });

        done();

      });

      var a = new Agent(v, 'deeper',  object, { deeper:  { value: 1 } }, []);

    }
  );


  it('sets unconfigurable properties',

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

  context('watch() creates a watch that...', function() {

    beforeEach(function() {

      // instance of Agent

      mock('instance', {
        name: 'KEY',
        value: {},
        vertex: {
          _tree: {
            _meta: {
              scanInterval: 20
            }
          }
        }
      });

    });

    it.only('calls created() when a new property is appended',

      function(done, expect, instance, Agent) {

        Agent.prototype.watch.call(instance);

        mock(instance).does(function created(key) {

          expect(key).to.equal('NewKey');

          done();

        });

        instance.value.NewKey = 1;

      }
    );

  });



  context('detecting changes', function() {

    it('raises change events on change of leaf value');

    it('raises change events on addition of leaf');

    it('raises change events on removal of leaf');

  });


});
