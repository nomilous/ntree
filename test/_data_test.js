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

  var reset = $$in(opts, function(
    done,
    flush,   // in. $ rm -fr {{mount}}
    extract, // in. $ tar -zxf {{archive}}
    ee
  ){
    done(ee);
  });

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

      before(reset);
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

  });


  xcontext('sync from disk to tree', function() {

    it('', function(done) {
      
      done();

    });

  });

});
