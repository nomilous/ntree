objective('Edge', function() {

  before(function(chai) {

    mock('expect', chai.expect);

  });

  beforeEach(function() {

    mock('left', {
      _pointer: {},
      _info: {
        route: [],
      },
      _tree: {
        _tools: {
          logger: {
            warn: function(m) {
              console.warn(m);
            }
          }
        },
        _meta: {

        }
      }
    });

    mock('right1', {
      _pointer: 'RIGHT 1 VALUE',
      _info: {
        fullname: __dirname + '/KEY.js',
        shared: false,
        stat: {
          isDirectory: function() {
            return false;
          }
        }
      }
    });

    mock('right2', {
      _pointer: 'RIGHT 2 VALUE',
      _info: {
        fullname: __dirname + '/KEY',
        shared: false,
        stat: {
          isDirectory: function() {
            return true;
          }
        }
      }
    });

  });

  it('creates the named enumerable property on the left vertex',

    function(done, expect, Edge, left, right1) {

      var e = new Edge(left, 'KEY', right1);
      expect(Object.keys(left._pointer)).to.eql(['KEY']);
      expect(left._pointer.KEY).to.equal('RIGHT 1 VALUE');
      done();

    }
  );

  it('creates a configurable property if right vertex is shared',

    function(done, expect, Edge, left, right1, right2) {

      right1._info.shared = true;

      var e = new Edge(left, 'KEY', right1);
      expect(left._pointer.KEY).to.equal('RIGHT 1 VALUE');

      var f = new Edge(left, 'KEY', right2);
      expect(left._pointer.KEY).to.equal('RIGHT 2 VALUE');

      done();

    }
  );


  it('creates an unconfigurable property if right vertex is not shared',

    function(done, expect, Edge, left, right1, right2) {

      right1._info.shared = false;

      var e = new Edge(left, 'KEY', right1);
      expect(left._pointer.KEY).to.equal('RIGHT 1 VALUE');

      mock(left._tree._tools.logger).does(function warn(message) {

        expect(message).to.match(/\(path duplicate\)/);

        // first property remains

        expect(left._pointer.KEY).to.equal('RIGHT 1 VALUE');

        // AND second right vertex is set to ignore

        expect(right2.ignore).to.equal(true);
        done();

      });

      var f = new Edge(left, 'KEY', right2);

    }
  );


  it('calls getSync() on getting property value',

    function(done, Edge, left, right1) {

      var e = new Edge(left, 'KEY', right1);

      mock(e).does(function getSync() {});

      left._pointer.KEY;

      done();

    }
  );


  it('calls setSync() on setting property value',

    function(done, expect, Edge, left, right1) {

      var e = new Edge(left, 'KEY', right1);

      mock(e).does(function setSync(value) {

        expect(value).to.equal('X');

        done();

      });

      left._pointer.KEY = 'X';

    }
  );

});
