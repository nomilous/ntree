require('in.');

objective('data', function() {


  before(function(done) {
    done(process.platform == 'win32' ? new Error('dunno about win32') : null);
  });


  opts = {
    cwd: __dirname,
    mount: __dirname + '/_data',
    archive: __dirname + '/_data.tgz',
  }


  before($$in(opts, function(
    done,
    flush,   // in. $ rm -fr {{mount}}
    extract, // in. $ tar -zxf {{archive}}
    ee
  ){
    done(ee);
  }));


  before(function(done, Tree) {
    Tree.create(opts).then(function(tree) {
      mock('tree', tree);
      done();
    }).catch(done);
  });


  context('sync from tree to disk', function() {

    it('', function(done, tree) {

      // console.log('\nTREE:', JSON.stringify(tree, null, 2));
      
      done();

    });

  });


  context('sync from disk to tree', function() {

    it('', function(done, tree) {
      
      done();

    });

  });

});
