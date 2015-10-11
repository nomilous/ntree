objective('Tree', function() {

  before(function(Tree) {

    mock('expect', require('chai').expect);

    mock('prototype', Tree.prototype).stub(function start(callback) {
      callback(null, this);
    });

  });


  context('create()', function() {


    it('creates an instance mounted on cwd with defaults',

      function(done, expect, Tree) {

        Tree.create()

        .then(function(tree) {

          expect(tree).to.be.an.instanceof(Tree);
          expect(tree._meta.mount).to.equal(process.cwd());
          expect(tree._meta.scanInterval).to.equal(1000);
          expect(tree._meta.watchInterval).to.equal(100);

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
          expect(tree._meta.watchInterval).to.equal(11);

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


  context('start()', function() {





  });



});
