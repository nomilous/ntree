objective('Vertex', function() {

  before(function(Vertex) {

    mock('prototype', Vertex.prototype);
    mock('expect', require('chai').expect);

  });

  context('loadAsync()', function() {

    context('lazy = false', function() {

      beforeEach(function(path) {

        mock('tree', {
          _meta: {
            lazy: false
          },
          _tools: {
            logger: console
          }
        });
        mock('mount', {
          value: path.normalize(__dirname + '/../test_data')
        });

      });

      it('calls loadAsFile if stat.isDirectory() is false',

        function(done, tree, mount, prototype, fs, Vertex) {

          mount.value = __filename;

          var v = new Vertex(tree, {keys: [], fullname: mount.value});

          prototype.does(function loadAsFile() {
            
          });

          v.loadAsync().then(done).catch(done);

        }
      );


      it('calls loadAsDirAsync if stat.isDirectory() is true',

        function(done, tree, mount, prototype, fs, Vertex) {

          mount.value = __dirname;

          var v = new Vertex(tree, {keys: [], fullname: mount.value});

          prototype.does(function loadAsDirAsync(callback) {
            callback();
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

          prototype.does(function loadAsFileAsync(callback) {
            callback();
          });

          v.loadAsync().then(done).catch(done);

        }
      );

      context('loadAsDirAsync()', function() {

        it('creates an Edge and a new Vertex for each object in the directory',

          function(done, expect, tree, mount, fs, Vertex, Edge) {

            tree._meta.lazy = true;

            var edges = [];

            mock(Edge.prototype).spy(
              function init() {
                edges.push(this.name);
              }
            )

            var v = new Vertex(tree, {keys: [], fullname: mount.value});

            v.loadAsync()

            .then(function(vertex) {

              expect(edges).to.eql([ 'planets.js', 'sun.js', 'sun', 'planets', 'dwarf_planets' ]);
              expect(Object.keys(vertex._edges)).to.eql(edges);
              expect(vertex._edges['planets'].right).to.be.an.instanceof(Vertex);
              expect(vertex._edges['sun'].right._info.stat.isCharacterDevice()).to.eql(false);

            })

            .then(done).catch(done);

          }

        );

      });

      context('loadAsFile()', function() {

        it('merges the file content into the tree',

          function(done, tree, mount, path, Vertex, fs, fxt, expect) {

            tree.along = {
              this: {
                path: {
                  through: {
                    the: 'woods'
                  }
                }
              }
            };

            mount.value = path.normalize('/along/this/path/went.js');

            var v = new Vertex(tree, {keys: ['along', 'this', 'path', 'went'], fullname: mount.value});


            fs.stub(
              // TODO: objective: readymade stub for require non-existant module
              function statSync(path) {
                if (path == '/along/this/path/went.js') {
                  return mock.original.call(this, __filename);
                }
                return mock.original.apply(this, arguments);
              },
              function realpathSync(path) {
                return path;
              },
              function readFileSync(path) {
                if (path != '/along/this/path/went.js') {
                  return mock.original.apply(this, arguments);
                }
                return fxt(function() {/*
                  module.exports = {
                    little: {
                      red:    9,
                      riding: 1,
                      hood:   9,
                    }
                  }
                */});
              }
            );

            var e = v.loadAsFile();

            if (e) return done(e);

            expect(tree.along).to.eql({
              this: {
                path: {
                  through: {
                    the: 'woods'
                  },
                  went: {
                    little: {
                      red: 9,
                      riding: 1,
                      hood: 9,
                    }
                  }
                }
              }
            });

            done();

          }

        );

      });


    });


    context('lazy = true', function() {

      it('');

    });

  });

});
