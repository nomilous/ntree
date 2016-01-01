require('in.');

objective('data', function() {


  before(function(done) {
    done(process.platform == 'win32' ? new Error('dunno about win32') : null);
  });

  before(function(chai) {
    mock('expect', chai.expect);
  })


  var opts = {
    cwd: __dirname,
    mount: __dirname + '/_data',
    archive: __dirname + '/_data.tgz',
  }

  var reset = function() {
    return $$in(opts, function(
      done,
      flush,   // in. $ rm -fr {{mount}}
      extract, // in. $ tar -zxf {{archive}}
      ee
    ){
      done(ee);
    });
  }

  var load = function(name) {
    return function(done, Tree) {
      Tree.create(opts).then(function(tree) {
        mock(name, tree);
        done();
      });
    }
  }

  context('sync from tree to disk', function() {

    context('creates directories', function() {

      before(reset());
      before(load('tree'))

      it('creates new directories on the root', function(done, expect, tree, fs, path) {

        tree.moo = {};

        // give the Agent a moment to detect the change

        setTimeout(function() {
          expect(fs.readdirSync(opts.mount)).to.eql(['moo', 'objects', 'objects.js']);
          expect(fs.statSync(opts.mount + path.sep + 'moo').isDirectory()).to.be.true;
          done();
        }, 25);

      });

      it('creates new directories a bit deeper', function(done, expect, tree, fs, path) {

        tree.objects.moo = {};

        setTimeout(function() {
          expect(fs.readdirSync(opts.mount + path.sep + 'objects')).to.eql(['O', 'R', 'T.js', 'moo']);
          expect(fs.statSync(opts.mount + path.sep + 'objects' + path.sep + 'moo').isDirectory()).to.be.true;
          done();
        }, 25);

      });

    });

    context('creates javascript files', function() {

      beforeEach(reset());
      beforeEach(load('tree'));

      it('create files with native value', function(done, expect, tree, fs, path) {

        tree.moo1 = 1;

        setTimeout(function() {
          expect(fs.readdirSync(opts.mount)).to.eql(['moo1.js', 'objects', 'objects.js']);
          expect(require(opts.mount + path.sep + 'moo1.js')).to.equal(1);
          done();

        }, 25)

      });

      it('create files with object value', function(done, expect, tree, fs, path) {

        tree.moo2 = {
          key1: {
            key3: 3,
            key4: 4,
            key5: {
              key7: false
            },
            key6: 6
          },
          key2: 2
        };

        setTimeout(function() {
          expect(fs.readdirSync(opts.mount)).to.eql(['moo2.js', 'objects', 'objects.js']);
          expect(require(opts.mount + path.sep + 'moo2.js')).to.eql({
            key1: {
              key3: 3,
              key4: 4,
              key5: {
                key7: false
              },
              key6: 6
            },
            key2: 2
          });
          done();

        }, 25)

      });

    });


    context('updates javascript files', function() {

      beforeEach(reset());
      beforeEach(load('tree'));

      it('writes new data in existing file', function(done, expect, tree, fs, path) {

        tree.objects.T.moo = 1;

        setTimeout(function() {
          delete require.cache[opts.mount + path.sep + 'objects' + path.sep + 'T.js'];
          var T = require(opts.mount + path.sep + 'objects' + path.sep + 'T.js');
          expect(T.fn()).to.equal('T');
          delete T.fn;
          expect(T).to.eql({
            boolean: false,
            moo: 1,
            number: 3,
            object: {
              E: 3
            },
            string: 'three'
          });
          done();

        }, 45);

      });


      it('updates data in existing file', function(done, expect, tree, fs, path) {

        tree.objects.S.boolean = 4;

        setTimeout(function() {
          delete require.cache[opts.mount + path.sep + 'objects.js'];

          var objects = require(opts.mount + path.sep + 'objects.js');

          expect(objects.A.fn()).to.equal('A');
          expect(objects.S.fn()).to.equal('S');
          delete objects.A.fn;
          delete objects.S.fn;

          expect(objects).to.eql({
            A: {
              boolean: true,
              number: 4,
              object: {
                R: 2
              },
              string: 'two'
            },
            S: {
              boolean: 4,
              number: 5,
              object: {
                A: 1
              },
              string: 'one'
            }
          });
          done();

        }, 145);

      });

    });


  });


  xcontext('sync from disk to tree', function() {

    it('');

  });

});
