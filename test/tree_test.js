objective('Tree', function() {

  before(function(Tree) {

    mock('expect', require('chai').expect);

    mock('deepcopy', function(obj) {
      return JSON.parse(JSON.stringify(obj));
    });

  });


  context('create()', function() {

    before(function(Tree) {

      mock('prototype', Tree.prototype).stub(function start(callback) {
        callback(null, this);
      });

    });


    it('creates an instance mounted on cwd with defaults',

      function(done, expect, Tree) {

        Tree.create()

        .then(function(tree) {

          expect(tree).to.be.an.instanceof(Tree);
          expect(tree._meta.mount).to.equal(process.cwd());
          expect(tree._meta.scanInterval).to.equal(1000);
          expect(tree._meta.watchInterval).to.equal(100);
          expect(tree._meta.lazy).to.equal(false);

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
          lazy: true,
        })

        .then(function(tree) {

          expect(tree).to.be.an.instanceof(Tree);
          expect(tree._meta.mount).to.equal('/the/bean/stalk');
          expect(tree._meta.scanInterval).to.equal(10);
          expect(tree._meta.watchInterval).to.equal(11);
          expect(tree._meta.lazy).to.equal(true);

        })

        .then(done).catch(done);
      }
    );


    it('starts the tree',

      function(done, Tree, prototype) {

        prototype.does({start: done});

        Tree.create();
      }
    );

  });


  context('functional', function() {

    it('can mount a simple flat file',

      function(done, expect, deepcopy, Tree) {

        Tree.create({

          mount: __dirname + '/../test_data/solar_system/sun.js'

        })

        .then(function(tree) {

          expect(deepcopy(tree)).to.eql({

            name: 'Sun'

          })

        })

        .then(done).catch(done);

      }
    );

    xit('can mount a simple directory of files',

      function(done, expect, deepcopy, Tree) {

        Tree.create({

          mount: __dirname + '/../test_data/solar_system/dwarf_planets'

        })

        .then(function(tree) {

          expect(deepcopy(tree)).to.eql({

            xx: 1

          })

        })

        .then(done).catch(done);

      }
    );

    it('supports setting serialization to not cross edges');

    it('supports asyncronous edges');

  });



});
