objective('Tree', function() {

  before(function(Tree) {

    mock('expect', require('chai').expect);

    mock('deepcopy', function(obj) {
      return JSON.parse(JSON.stringify(obj));
    });

  });


  context('create()', function() {

    before(function(Vertex) {

      mock(Vertex.prototype).stub(function init(callback) {
        callback(null, this);
      });

    });


    it('creates an instance mounted on cwd with defaults',

      function(done, expect, Tree) {

        Tree.create()

        .then(function(tree) {

          expect(tree).to.be.an.instanceof(Tree);
          expect(tree._meta.mount).to.equal(process.cwd());
          expect(tree._meta.scanInterval).to.equal(20);

        })

        .then(done).catch(done);
      }
    );


    it('creates an instance as configured',

      function(done, expect, Tree) {

        Tree.create({
          mount: '/the/bean/stalk',
          climb: 'quietly',
          dont: 'steal anything',
          scanInterval: 10,
          watchInterval: 11,
        })

        .then(function(tree) {

          expect(tree).to.be.an.instanceof(Tree);
          expect(tree._meta.mount).to.equal('/the/bean/stalk');
          expect(tree._meta.scanInterval).to.equal(10);

        })

        .then(done).catch(done);
      }
    );


    it('assembles and activates the tree',

      function(done, Tree) {

        var promise = {
          then: function(fn) {
            return fn();
          }
        }

        mock(Tree.prototype).does(
          function _assemble() {return promise;},
          function _activate() {done(); return promise;}
        );

        Tree.create();
      }
    );

  });

  context('event emitter', function() {

    before(function(Vertex) {

      mock(Vertex.prototype).stub(function init(callback) {
        callback(null, this);
      });

    });

    it('has an accessable event emitter',
      function(done, expect, Tree, events) {

        Tree.create({
          mount: '/path',
          scanInterval: 10,
          watchInterval: 11,
        })

        .then(function(tree) {
          expect(tree._emitter).to.be.an.instanceof(events.EventEmitter);
        })

        .then(done).catch(done);
      }
    );

    it('creates unserialized on() and once() functions',
      function(done, expect, Tree, events) {

        var test1 = 0, test2 = 0;

        Tree.create({
          mount: '/path',
          scanInterval: 10,
          watchInterval: 11,
        })

        .then(function(tree) {
          expect(tree.on).to.be.an.instanceof(Function);
          expect(tree.once).to.be.an.instanceof(Function);

          tree.on('test1', function() {
            test1++;
          });

          tree.once('test2', function() {
            test2++;
          });

          tree._emitter.emit('test1');
          tree._emitter.emit('test1');
          tree._emitter.emit('test2');
          tree._emitter.emit('test2');

          expect(test1).to.equal(2);
          expect(test2).to.equal(1);

        })

        .then(done).catch(done);
      }
    );

  });

  context('with instance', function() {

    context('_assemble()', function() {

    });

    context('_activate()', function() {

    });

  });


  context('functional', function() {

    it('can mount a simple flat file',

      function(done, expect, deepcopy, Tree) {

        Tree.create({

          mount: __dirname + '/../sample/solar_system/sun.js'

        })

        .then(function(tree) {

          expect(deepcopy(tree)).to.eql({

            name: 'Sun'

          })

        })

        .then(done).catch(done);

      }
    );

    it('can mount a simple directory of files',

      function(done, expect, deepcopy, Tree) {

        Tree.create({

          mount: __dirname + '/../sample/solar_system/dwarf_planets'

        })

        .then(function(tree) {

          expect(deepcopy(tree)).to.eql({

            eris: {
              name: 'Eris',
              radius: 1163000,
            },
            makemake: {
              name: 'Makemake',
              radius: 739000,
            },
            pluto: {
              name: 'Pluto',
              radius: 1186000,
            }

          })

        })

        .then(done).catch(done);

      }
    );

    it('supports setting serialization to not cross edges');

    it('supports asyncronous edges');

  });



});
