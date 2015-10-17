objective('Agent', function() {

  before(function() {

    mock('expect', require('chai').expect);

  });

  it('creates native type properties',

    function(expect, Vertex, Agent) {

      v = new Vertex({}, {route: []});

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

  it('attaches empty object if not native type',

    function(expect, Vertex, Agent) {

      v = new Vertex({}, {route: []});

      object = {};

      var a = new Agent(v, 'deeper',  object, { deeper:  { value: 1 } }, []);

      expect(object).to.eql({
        deeper: {
          // value: 1

          // does not add value: 1 because it's the job
          // of the recursion in assemble() to build the
          // tree. Each define() only defines itself.
        }
      });

    }
  );


  it('sets unconfigurable properties',

    function(done, expect, Vertex, Agent) {

      v = new Vertex({}, {route: []});

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

  context('detecting changes', function() {

    it('raises change events on change of leaf value');

    it('raises change events on addition of leaf');

    it('raises change events on removal of leaf');

  });


});
