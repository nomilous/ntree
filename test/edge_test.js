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

    mock('rightAsFile', {
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

    mock('rightAsDirectory', {
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

    function(done, expect, Edge, left, rightAsFile) {

      var e = new Edge(left, 'KEY', rightAsFile);
      expect(Object.keys(left._pointer)).to.eql(['KEY']);
      expect(left._pointer.KEY).to.equal('RIGHT 1 VALUE');
      done();

    }
  );

  it('creates a configurable property if right vertex is shared',

    function(done, expect, Edge, left, rightAsFile, rightAsDirectory) {

      rightAsFile._info.shared = true;

      var e = new Edge(left, 'KEY', rightAsFile);
      expect(left._pointer.KEY).to.equal('RIGHT 1 VALUE');

      var f = new Edge(left, 'KEY', rightAsDirectory);
      expect(left._pointer.KEY).to.equal('RIGHT 2 VALUE');

      done();

    }
  );


  it('sets ignoreCreate true if right vertex is shared and not a directory',

    function(done, expect, Edge, left, rightAsFile) {

      rightAsFile._info.shared = true;

      var e = new Edge(left, 'KEY', rightAsFile);
      expect(e.ignoreCreate).to.be.true;


      done();

    }
  );

  it('sets ignoreCreate false if right vertex is shared and a directory',

    function(done, expect, Edge, left, rightAsDirectory) {

      rightAsDirectory._info.shared = true;

      var e = new Edge(left, 'KEY', rightAsDirectory);
      expect(e.ignoreCreate).to.be.false;

      done();

    }
  );


  xit('creates an unconfigurable property if right vertex is not shared',

    function(done, expect, Edge, left, rightAsFile, rightAsDirectory) {

      rightAsFile._info.shared = false;

      var e = new Edge(left, 'KEY', rightAsFile);
      expect(left._pointer.KEY).to.equal('RIGHT 1 VALUE');

      mock(left._tree._tools.logger).does(function warn(message) {

        expect(message).to.match(/\(path duplicate\)/);

        // first property remains

        expect(left._pointer.KEY).to.equal('RIGHT 1 VALUE');

        // AND second right vertex is set to ignore

        expect(rightAsDirectory.ignore).to.equal(true);
        done();

      });

      var f = new Edge(left, 'KEY', rightAsDirectory);

    }
  );


  it('calls getSync() on getting property value',

    function(done, Edge, left, rightAsFile) {

      var e = new Edge(left, 'KEY', rightAsFile);

      mock(e).does(function getSync() {});

      left._pointer.KEY;

      done();

    }
  );


  it('calls setSync() on setting property value',

    function(done, expect, Edge, left, rightAsFile) {

      var e = new Edge(left, 'KEY', rightAsFile);

      mock(e).does(function setSync(value) {

        expect(value).to.equal('X');

        done();

      });

      left._pointer.KEY = 'X';

    }
  );

});
