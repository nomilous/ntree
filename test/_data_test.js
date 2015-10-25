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
      before(load('tree1'))

      it('creates new directories on the root', function(done, expect, tree1, fs, path) {

        console.log('xxx')

        tree1.moo = {};

        // give the Agent a moment to detect the change

        setTimeout(function() {
          expect(fs.readdirSync(opts.mount)).to.eql(['moo', 'objects', 'objects.js']);
          expect(fs.statSync(opts.mount + path.sep + 'moo').isDirectory()).to.be.true;
          done();
        }, 25);

      });

      it('creates new directories a bit deeper', function(done, expect, tree1, fs, path) {

        tree1.objects.moo = {};

        setTimeout(function() {
          expect(fs.readdirSync(opts.mount + path.sep + 'objects')).to.eql(['O', 'R', 'T.js', 'moo']);
          expect(fs.statSync(opts.mount + path.sep + 'objects' + path.sep + 'moo').isDirectory()).to.be.true;
          done();
        }, 25);

      });

    });

    context('creates javascript files', function() {

      before(reset());
      before(load('tree2'));

      it('create files with one value', function(done, expect, tree2, fs, path) {

        tree2.moo = 1;
        setTimeout(function() {
          expect(fs.readdirSync(opts.mount)).to.eql(['moo.js', 'objects', 'objects.js']);
          expect(require(opts.mount + path.sep + 'moo.js')).to.equal(1);
          done();

        }, 25)

      });

    });


    context('updates javascript files', function() {

      it('');

    });


  });


  xcontext('sync from disk to tree', function() {

    it('');

  });

});
