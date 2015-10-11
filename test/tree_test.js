objective('Tree', function() {

  before(function(Tree) {

    mock('expect', require('chai').expect);

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


  context('start()', function() {

    it('initializes the Tree as a Vertex and loads asyncronously',

      function(done, Tree, Vertex) {

        mock(Vertex.prototype).does(
          function loadAsync(callback) {
            callback(null, this);
          }
        );

        Tree.create({mount: '/ntree/point'}).then(done).catch(done);

      }
    );

  });



});
