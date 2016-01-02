objective('Vertex', function() {

  before(function(Vertex) {

    mock('prototype', Vertex.prototype);

    mock('expect', require('chai').expect);

    mock('promiseOf', function(data) {
      return {
        then: function(callback) {
          process.nextTick(function() {
            callback(data);
          });
          return {
            then: function(callback) {
              process.nextTick(function() {
                callback();
              });
              return {
                catch: function() {}
              }
            },
            catch: function() {}
          }
        }
      }
    });

  });

  beforeEach(function(path) {

    mock('tree', {
      _meta: {
      },
      _tools: {
        logger: console
      },
      _pointer: {
      },
      _serializers: {
        '.js': {},
        '.i': {},
      }
    });

    mock('mount', {
      value: path.normalize(__dirname + '/../test_data')
    });

  });

  context('walk()', function() {

    it('returns the tree if vertex route is root (no keys)',

      function(done, expect, Vertex) {

        var v = new Vertex('TREE', {route: []});
        expect(v.walk()).to.equal('TREE');
        done();

      }
    );

    it('returns the place in the tree that route points to',

      function(done, expect, Vertex) {

        var v = new Vertex({one: { two: { three: 3}}}, {route: ['one', 'two', 'three']});
        expect(v.walk()).to.equal(3);
        done();

      }
    );

  });

  context('init()', function() {

    it('calls loadFileSync() if stat.isDirectory() is false and route is root',

      function(done, tree, mount, prototype, Vertex) {

        mount.value = __filename;

        var v = new Vertex(tree, {route: [], fullname: mount.value});

        prototype.does(function loadFileSync() {});

        v.init().then(done).catch(done);

      }
    );


    it('does not call loadFileSync() stat.isDirectory() is false and route is not root',
      
      function(done, tree, mount, prototype, Vertex) {

        // var ran = false;

        mount.value = __filename;

        var v = new Vertex(tree, {route: ['locus'], fullname: mount.value});

        prototype.spy(function loadFileSync() {
          throw new Error('should not run');
        });

        v.init().then(done).catch(done);

      }
    );


    it('calls loadDirectory() if stat.isDirectory() is true and route is root',

      function(done, tree, mount, prototype, Vertex) {

        mount.value = __dirname;

        var v = new Vertex(tree, {route: [], fullname: mount.value});

        prototype.does(function loadDirectory(callback) {
          callback();
        });

        v.init().then(done).catch(done);

      }
    );


    it('uses existing stat if present',

      function(done, tree, mount, prototype, Vertex) {

        mount.value = __dirname;

        var v = new Vertex(tree, {
          route: [],
          fullname: mount.value,
          stat: {
            isDirectory: function() {
              return false
            }
          }
        });

        prototype.does(function loadFileSync() {});

        v.init().then(done).catch(done);

      }
    );

  });

  context('loadDirectory()', function() {

    it('lists the content of the directory and hands it down a chain of functions',

      function(done, expect, Vertex, prototype, tree, mount) {

        var order = [];

        // ...AND recurses into nested directories

        testRecurse = mock('vertex', {
          init: function() {
            order.push(5);
          }
        });

        prototype.does(

          function createVertexInfo() { order.push(1); },
          function groupVertexTypes() { order.push(2); },
          function attachVertexFiles() { order.push(3); },
          function attachVertexDirectories() {
            order.push(4);
            return {
              then: function(fn) {
                fn([testRecurse]);
                return {
                  then: function(fn) {
                    fn();
                    return {
                      catch: function() {}
                    }
                  }
                }
              }
            }
          }

        );

        var v = new Vertex(tree, {
          route: [],
          fullname: mount.value,
          serializer: {
            decodeAsync: function() {
              // mock directory serializer
            }
          }
        });

        v.loadDirectory().then(function() {

          expect(order).to.eql([1, 2, 3, 4, 5]);
          done();

        });

      }
    );

  });

  context('createVertexInfo()', function() {

    it('stats each item in the promised directory listing',

      // And creates a vertex config from each
      // And filters out items where stat errored

      function(done, fs, expect, Vertex, tree, mount, promiseOf) {

        var v = new Vertex(tree, {route: [], fullname: mount.value});

        var directoryListing = ['content', 'of', 'directory', 'with-a-file.js'];

        var createResultPromise = function(isDir, error) {
          return {
            then: function(handler) {
              if (!error) {
                handler({
                  isDirectory: function() { return isDir; }
                });
              }
              return {
                catch: function(handler) {
                  if (error) handler(error);
                }
              }
            }
          }
        }

        fs.does(
          function statAsync(filename) {
            expect(filename).to.equal(mount.value + '/content');
            return createResultPromise(true);
          },

          function statAsync(filename) {
            expect(filename).to.equal(mount.value + '/of');
            return createResultPromise(true, 'Error string');
          },

          function statAsync(filename) {
            expect(filename).to.equal(mount.value + '/directory');
            return createResultPromise(true);
          },

          function statAsync(filename) {
            expect(filename).to.equal(mount.value + '/with-a-file.js');
            return createResultPromise(false);
          }

        )

        v.createVertexInfo(promiseOf(directoryListing))

        .then(function(vertexInfoList) {

          expect(
            vertexInfoList.map(function(vertexInfo) {
              return {
                name: vertexInfo.name,
                route: vertexInfo.route,
              }
            })
          )
          .to.eql([
            {name: 'content', route: ['content']},
            // {name: 'of', route: ['of']},        // not included, stat() errored
            {name: 'directory', route: ['directory']},
            {name: 'with-a-file.js', route: ['with-a-file']},
          ]);

        })

        .then(done).catch(done);

      }

    );

  });


  context('groupVertexTypes()', function() {

    it('groups the list of vertexes by type',

      function(done, expect, Vertex, tree, mount, promiseOf) {

        var v = new Vertex(tree, {route: [], fullname: mount.value});

        var vertexInfoList = [
          {
            name: 'dir1',
            route: [],
            stat: {
              isDirectory: function() { return true; }
            },
          },
          {
            name: 'dir2',
            route: [],
            stat: {
              isDirectory: function() { return true; }
            }
          },
          {
            name: 'something.else',
            route: [],
            stat: {
              isDirectory: function() { return false; }
            }
          },
          {
            name: 'info.i',
            route: [],
            stat: {
              isDirectory: function() { return false; }
            }
          },
          {
            name: 'file1.js',
            route: [],
            stat: {
              isDirectory: function() { return false; }
            }
          },
          {
            name: 'dir3',
            route: [],
            stat: {
              isDirectory: function() { return true; }
            }
          },
          {
            name: 'file2.js',
            route: [],
            stat: {
              isDirectory: function() { return false; }
            }
          }
        ];

        v.groupVertexTypes(promiseOf(vertexInfoList))

        .then(function(sets) {

          expect(sets.directories.map(function(info) {
            return info.name})
          ).to.eql(['dir1', 'dir2', 'dir3']);

          expect(sets.files['.js'].map(function(info) {
            return info.name})
          ).to.eql(['file1.js', 'file2.js']);

          expect(sets.files['.i'].map(function(info) {
            return info.name})
          ).to.eql(['info.i']);

        })

        .then(done).catch(done);

      }
    );

  });


  context('attachVertexFiles()', function() {

    xit('creates edges and joins file vertices to the tree',

      function(done, expect, Vertex, Edge, tree, mount, promiseOf) {

        tree.branch = {};

        var v = new Vertex(tree, {route: ['branch'], fullname: mount.value});

        var sortedVertexInfo = {
          files: {
            '.js': [
              {
                route: ['branch', 'leaf1']
              },
              {
                route: ['branch', 'leaf2']
              }
            ]
          }
        }

        mock(Vertex.prototype).does(
          function loadFileSync() {},
          function loadFileSync() {}
        );

        // mock(Edge.prototype).does(
        //   function link() {},
        //   function link() {}
        // );

        v.attachVertexFiles(promiseOf(sortedVertexInfo))

        .then(function(result) {

          // console.log(v._edges);

          // console.log('RESULT', result);

        })

        .then(done).catch(done);

      }
    );

  });


  context('loadFileSync()', function() {

    it('reads/decodes through the vertex\'s serializer and attaches the result',

      function(done, expect, Vertex) {

        var vertexInfo = {
          route: [],
          name: 'NAME',
          serializer: {
            decodeSync: function(vertex) {
              expect(vertex._info.name).to.equal('NAME');
              return 'CONTENT';
            }
          }
        }

        var v = new Vertex({}, vertexInfo);

        mock(Vertex.prototype).does(
          function attachContent(content) {
            expect(content).to.equal('CONTENT');
            done(); 
          }
        )

        v.loadFileSync();

      }

    );


  });


  context('attachContent()', function() {

    it('attaches directly to pointer if content is a native type',

      function(expect, Vertex) {

        var vertexInfo = {
          route: [],
          // name: 'NAME',
        }

        var v1 = new Vertex({}, vertexInfo);
        v1.attachContent(1);

        var v2 = new Vertex({}, vertexInfo);
        v2.attachContent('two');

        var v3 = new Vertex({}, vertexInfo);
        v3.attachContent(false);

        expect([
          v1._pointer,
          v2._pointer,
          v3._pointer
        ]).to.eql([1, 'two', false])

      }
    );


    it('recurses object content and creates property agents for each',

      function(expect, Vertex, Agent) {

        var vertexInfo = {
          route: ['starting', 'route'],
          // name: 'NAME',
        }

        var tree = {
          _tools: {
            logger: {}
          },
          _meta: {
            scanInterval: 20
          },
          starting: {
            route: {

            }
          }
        }

        var v = new Vertex(tree, vertexInfo);

        v.attachContent({
          an: 'object',
          which: {
            has: 'a bit more',
            complexity: true,
          },
          like: 0
        });

        expect(Object.keys(v._agents)).to.eql([
          'starting/route/an',
          'starting/route/which',
          'starting/route/which/has',
          'starting/route/which/complexity',
          'starting/route/like',
        ]);

        expect(v._agents['starting/route/an']).to.be.an.instanceof(Agent);

      }
    );

    it('supports Array');

    it('supports Date');

    it('supports RegExp');

    it('supports Buffer');

    it('supports Function');

  });


  context('attachVertexDirectories()', function() {

    xit('creates edges and joins directory vertices to the tree',

      function(done, expect, Vertex, Edge, tree, mount, promiseOf) {

        tree.branch = {};

        var v = new Vertex(tree, {route: ['branch'], fullname: mount.value});

        var sortedVertexInfo = {
          'directories': [
            {
              route: ['branch', 'dir1']
            },
            {
              route: ['branch', 'dir2']
            }
          ]
        }

        // mock(Edge.prototype).does(
        //   function link() {},
        //   function link() {}
        // );

        v.attachVertexDirectories(promiseOf(sortedVertexInfo))

        .then(done).catch(done);


      }
    );

  });


  context('onCreatedKey()', function() {

    context('when called on a non-directory vertex', function() {

      it('calls whatever serializer loaded the vertex',

        function(done, Vertex, expect) {

          var called = false;
          var vertex = {
            _tree: {
              _notify: function() {
                expect(called).to.be.true;
                done();
              }
            },
            _info: {
              serializer: {
                encodeSync: function() {
                  called = true;
                  
                }
              }
            }
          }

          var agent = {
            getSync: function() {
              return {
                key: 'Value'
              }
            }
          }

          Vertex.prototype.onCreatedKey.call(vertex, 'key', agent);

        }
      );

    });

    context('when called on a directory vertex', function() {

      before(function() {
        mock('vertex', {
          _tree: {
            _serializers: {
              '.js': mock('javascriptSerializer', {
                constructor: {
                  name: 'Javascript'
                }
              })
            },
          },
          _info: {
            serializer: mock('directorySerializer', {
              constructor: {
                name: 'Directory'
              }
            })
          }
        });
        mock('agent');
      });

      it('calls the directory serializer if the new value is an empty object',

        function(done, expect, directorySerializer, agent, vertex, Vertex) {

          agent.does(function getSync() {
            return {
              KEY: {}
            }
          });

          directorySerializer.does(function encodeSync(vertex, change) {
            expect(change).to.eql({
              op: 'create',
              key: 'KEY',
              value: {}
            });
          });

          mock(vertex._tree).does(function _notify() {
            done();
          });

          Vertex.prototype.onCreatedKey.call(vertex, 'KEY', agent);
          
        }

      );

      it('calls the javascript serializer if the new value is a native type',

        function(done, expect, javascriptSerializer, agent, vertex, Vertex) {

          agent.does(function getSync() {
            return {
              KEY: 1
            }
          });

          javascriptSerializer.does(function encodeSync(vertex, change) {
            expect(change).to.eql({
              op: 'create',
              key: 'KEY',
              value: 1
            });
          });

          mock(vertex._tree).does(function _notify() {
            done();
          });

          Vertex.prototype.onCreatedKey.call(vertex, 'KEY', agent);
          
        }

      );

      it('calls the javascript serializer if the new value is an object with nested values',

        function(done, expect, javascriptSerializer, agent, vertex, Vertex) {

          agent.does(function getSync() {
            return {
              KEY: {
                more: 1
              }
            }
          });

          javascriptSerializer.does(function encodeSync(vertex, change) {
            expect(change).to.eql({
              op: 'create',
              key: 'KEY',
              value: {
                more: 1
              }
            });
          });

          mock(vertex._tree).does(function _notify() {
            done();
          });

          Vertex.prototype.onCreatedKey.call(vertex, 'KEY', agent);
          
        }

      );


    });

  });

  context('onUpdatedKey()', function() {

    beforeEach(function(tree) {
      mock('vertex', {
        _info: {
          name: 'name',
          serializer: {}
        },
        _tree: tree
      });

      mock('agent', {});
    });

    it('calls tree notify and serializer encode',
      function(done, Vertex, vertex, agent, tree) {

        mock(vertex._info.serializer).does(function encodeSync() {});

        tree.does(function _notify() {
          done();
        });

        Vertex.prototype.onUpdatedKey.call(vertex, 'KEY', agent, 'OLDVAL');

      }
    );

  });

  context('onDestroyedKey()', function() {

    beforeEach(function(tree) {
      mock('vertex', {
        _info: {
          name: 'name',
          serializer: {}
        },
        _tree: tree
      });

      mock('agent', {});
    });

    it.only('calls tree notify and serializer encode',
      function(done, Vertex, vertex, agent, tree) {

        mock(vertex._info.serializer).does(function encodeSync() {});

        tree.does(function _notify() {
          done();
        });

        Vertex.prototype.onDestroyedKey.call(vertex, 'KEY', agent, 'OLDVAL');

      }
    );

  });

});
