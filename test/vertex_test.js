objective('Vertex', function() {

  before(function(Vertex) {

    mock('prototype', Vertex.prototype);

  });

  context('loadAsync()', function() {

    context('lazy = false', function() {

      beforeEach(function(path) {

        mock('tree', {
          _meta: {
            lazy: false
          }
        });
        mock('mount', {
          value: path.normalize(__dirname + '/../test_data')
        });

      });

      it('calls loadAsFileAsync of stat.isDirectory() is false',

        function(done, tree, mount, prototype, fs, Vertex) {

          mount.value = __filename;

          var v = new Vertex(tree, {keys: [], fullname: mount.value});

          prototype.does(function loadAsFileAsync(control) {
            control.callback();
          });

          v.loadAsync().then(done).catch(done);

        }
      );


      it('calls loadAsDirAsync of stat.isDirectory() is true',

        function(done, tree, mount, prototype, fs, Vertex) {

          mount.value = __dirname;

          var v = new Vertex(tree, {keys: [], fullname: mount.value});

          prototype.does(function loadAsDirAsync(control) {
            control.callback();
          });

          v.loadAsync().then(done).catch(done);

        }
      );


      it('uses existing stat if present',

        function(done, tree, mount, prototype, fs, Vertex) {

          mount.value = __dirname;

          var v = new Vertex(tree, {
            keys: [],
            fullname: mount.value,
            stat: {
              isDirectory: function() {
                return false
              }
            }
          });

          prototype.does(function loadAsFileAsync(control) {
            control.callback();
          });

          v.loadAsync().then(done).catch(done);

        }
      );


    });


    context('lazy = true', function() {

      it('');

    });

  });

  context('loadAsDirAsync()', function() {

    xit('creates nested vertexes from the directory contents',

      function(done) {

      }

    );

  });

  context('loadAsFileAsync()', function() {

    xit('loads the file',

      function(done) {

      }

    );

  });

});
