objective('SolarSystem', function(path) {

  var SOURCE = path.normalize(__dirname + '/../sample/solar_system');
  var MOUNT = path.normalize(__dirname + '/_temp/solar_system');

  before(function() {
    mock('ntree', require('../'));
    mock('expect', require('chai').expect);
  });

  beforeEach('clear test directory', function(done, rimraf) {
    rimraf(MOUNT, done);
  });

  beforeEach('create test directory', function(done, mkdirp) {
    mkdirp(MOUNT, done);
  });

  beforeEach('create solar system', function(done, cpr) {
    cpr(SOURCE, MOUNT, function() {
      setTimeout(done, 50); // TODO: cp -R is calling back early
    });
  });

  afterEach('destroy solar system', function(done, rimraf) {
    rimraf(MOUNT, done);
  });

  afterEach('toss makemake', function(done, rimraf) {
    rimraf(path.normalize(MOUNT + '/../makemake'), done);
  });

  beforeEach('create expected system', function() {
    mock('SolarSystem', {
      dwarf_planets: {
        makemake: {
          name: "Makemake",
          radius: 739000
        },
        eris: {
          name: "Eris",
          radius: 1163000
        },
        pluto: {
          name: "Pluto",
          radius: 1186000
        }
      },
      planets: {
        inner: {
          venus: {
            name: "Venus",
            radius: 6052000
          },
          earth: {
            name: "Earth",
            radius: 6371000
          },
          mars: {
            name: "Mars",
            radius: 3390000
          },
          mercury: {
            name: "Mercury",
            radius: 2440000
          }
        },
        outer: {
          saturn: {
            name: "Saturn",
            radius: 58232000
          },
          uranus: {
            name: "Uranus",
            radius: 25362000
          },
          neptune: {
            name: "Neptune",
            radius: 24622000
          },
          jupiter: {
            name: "Jupiter",
            radius: 69911000
          }
        }
      },
      sun: {
        name: "Sun",
        radius: 696000000
      }
    });
  });


  it('loads the solar system ok',
    function(done, expect, ntree, SolarSystem) {
      ntree.create(MOUNT).then(function(tree) {
        expect(JSON.parse(JSON.stringify(tree))).to.eql(SolarSystem);
        tree._stop();
        done();
      }).catch(done);
  });


  context.only('syncIn', function() {

    afterEach(function() {
      // when some of the tests fail thay can leave the tree active
      // and then events are fired on the cleanup deletions from _temp 
      if (this.tree) this.tree._stop();


      // this.timeout(4000);
      // setTimeout(done, 3000);
    });

    context('changed source files', function() {
      
      context('updates tree (file, no overlap)', function() {

        it('changes keys and emits patches',
          function(done, expect, ntree, SolarSystem, fxt, fs, path) {
            var _this = this;
            ntree.create(MOUNT).then(function(tree) {
              _this.tree = tree;
              var changesource = path.normalize(MOUNT + '/planets/inner/mercury.js');
              var content = fxt(function() {/*
                module.exports = {
                  name: 'Mercury',
                  radius: 2440000
                }
              */});

              tree.on('$patch', function(patch) {
                try {
                  console.log(patch);
                } catch (e) {
                  tree._stop();
                  return done(e);
                }
                tree._stop();
                done();
              });

              fs.writeFileSync(changesource, content);
            }).catch(done);

        });

        it('adds new keys (updates vtree) and emits patches');

        it('removes keys (updates vtree) and emits patches');

      });

      context('updates tree (file, with overlap)', function() {

        it('changes keys and emits patches');

        it('add new keys (updates vtree) and emits patches (onMultiple last)');

        it('add new keys (updates vtree) and emits patches (onMultiple first)');

        it('add new keys (updates vtree) and emits patches (onMultiple fn)');

        it('removes keys (updates vtree) and emits patches (onMultiple last');

        it('removes keys (updates vtree) and emits patches (onMultiple first');

        it('removes keys (updates vtree) and emits patches (onMultiple fn');

      });

    });

    context('new source files/dirs', function() {

      it('adds to tree (file, no overlap)',
        function(done, expect, ntree, SolarSystem, fxt, fs, path) {
          var _this = this;
          ntree.create(MOUNT).then(function(tree) {
            _this.tree = tree;

            var newsource = path.normalize(MOUNT + '/planets/outer/jupiter/moons.js');
            var content = fxt(function() {/*
              module.exports = {
                europa: {},
                io: {},
                ganymede: {},
                callisto: {}
              }
            */});

            tree.on('$patch', function(patch) {

              if (patch.doc.path !== '/planets/outer/jupiter/moons') {
                console.log('unexpected patch', patch);
                return;
              }

              try {

                expect(patch).to.eql({
                  doc: {
                    path: '/planets/outer/jupiter/moons'
                  },
                  patch: [{
                    op: 'add',
                    path: '',
                    value: {
                      europa: {},
                      io: {},
                      ganymede: {},
                      callisto: {}
                    }
                  }]
                });

                var moons = tree._vertices.planets.outer.jupiter.moons;
                expect(moons.__.sources.length).to.equal(1);
                expect(moons.__.sources[0].filePath).to.equal('planets/outer/jupiter/moons.js');
                expect(moons.io.__.sources.length).to.equal(1);
                expect(moons.io.__.sources[0].filePath).to.equal('planets/outer/jupiter/moons.js');

              } catch (e) {
                tree._stop();
                return done(e);
              }

              // ensure the agent does not report the new key (would lead to sync _back_ out)
              var ran = false;
              mock(tree._vertices.planets.outer.jupiter.__.agent).spy(function onChanged(change) {
                ran = true;
              });

              setTimeout(function() {
                tree._stop();
                expect(ran).to.be.false;
                done();
              }, 50);
            });

            fs.writeFileSync(newsource, content);

          }).catch(done);
      });

      it('adds to tree (file, with overlap)',
        function(done, expect, ntree, SolarSystem, fxt, fs, path) {
          var _this = this;
          ntree.create(MOUNT).then(function(tree) {
            _this.tree = tree;
            var newsource = path.normalize(MOUNT + '/planets/outer.js');
            var content = fxt(function() {/*
              module.exports = {
                jupiter: {
                  moons: {
                    europa: {},
                    io: {},
                    ganymede: {},
                    callisto: {}
                  }
                }
              }
            */});

            tree.on('$patch', function(patch) {
              if (patch.doc.path !== '/planets/outer') {
                console.log('unexpected patch', patch);
                return;
              }
              try {
                expect(patch).to.eql({
                  doc: {
                    path: '/planets/outer'
                  },
                  patch: [{
                    op: 'add',
                    path: '/jupiter/moons',
                    value: {
                      europa: {},
                      io: {},
                      ganymede: {},
                      callisto: {}
                    }
                  }]
                });

                // expect(tree._vertices.planets.outer.__.sources.length).to.equal(3);
                // expect(tree._vertices.planets.outer.__.sources[0].filePath).to.equal('planets.js');
                // expect(tree._vertices.planets.outer.__.sources[1].filePath).to.equal('planets/outer');

                var moons = tree._vertices.planets.outer.jupiter.moons;
                expect(moons.__.sources.length).to.equal(1);
                expect(moons.__.sources[0].filePath).to.equal('planets/outer.js');
                expect(moons.io.__.sources.length).to.equal(1);
                expect(moons.io.__.sources[0].filePath).to.equal('planets/outer.js');

              } catch (e) {
                tree._stop();
                return done(e);
              }

              // ensure the agent does not report the new key (would lead to sync _back_ out)
              var ran = false;
              mock(tree._vertices.planets.outer.jupiter.__.agent).spy(function onChanged(change) {
                ran = true;
              });

              setTimeout(function() {
                tree._stop();
                expect(ran).to.be.false;
                done();
              }, 50);
            });

            fs.writeFileSync(newsource, content);

          }).catch(done);
      });
      
      it('adds to tree (directory, no overlap)',
        // add moons dir to jupiter (completely new node)
        function(done, expect, ntree, SolarSystem, mkdirp, path) {
          var _this = this;
          ntree.create(MOUNT).then(function(tree) {
            _this.tree = tree;
            
            var newsource = path.normalize(MOUNT + '/planets/outer/jupiter/moons');

            tree.on('$patch', function(patch) {
              if (patch.doc.path !== '/planets/outer/jupiter/moons') {
                console.log('unexpected patch', patch);
                return;
              }
              try {
                expect(patch).to.eql({
                  doc: {
                    path: '/planets/outer/jupiter/moons'
                  },
                  patch: [{
                    op: 'add',
                    path: '',
                    value: {}
                  }]
                })

                expect(tree._vertices.planets.outer.jupiter.moons.__).to.exist;
                expect(tree.planets.outer.jupiter.moons).to.eql({});
              } catch (e) {
                tree._stop();
                return done(e);
              }

              var ran = false;
              mock(tree._vertices.planets.outer.jupiter.__.agent).spy(function onChanged(change) {
                ran = true;
              });

              setTimeout(function() {
                tree._stop();
                expect(ran).to.be.false;
                done();
              }, 50);
            });

            mkdirp(newsource);
          }).catch(done);
      });

      it('adds to tree (directory, with overlap)',
        // add earth dir (defining node already defined in planets.js and inner.js)
        function(done, expect, ntree, SolarSystem, mkdirp, path) {
          var _this = this;
          ntree.create({
            mount: MOUNT,
            patch: {
              noop: true // only emits patch if patch.noop is enabled
            }
          }).then(function(tree) {
            _this.tree = tree;
            
            var newsource = path.normalize(MOUNT + '/planets/inner/earth');

            tree.on('$patch', function(patch) {
              if (patch.doc.path !== '/planets/inner/earth') {
                console.log('unexpected patch', patch);
                return;
              }
              tree._stop();
              try {
                expect(patch).to.eql({
                  doc: {
                    path: '/planets/inner/earth'
                  },
                  patch: [{
                    op: 'noop',
                    path: ''
                  }]
                })

                expect(tree._vertices.planets.inner.earth.__.sources.length).to.equal(3);
                expect(tree._vertices.planets.inner.earth.__.sources[0].filePath).to.equal('planets.js');
                expect(tree._vertices.planets.inner.earth.__.sources[1].filePath).to.equal('planets/inner.js');
                expect(tree._vertices.planets.inner.earth.__.sources[2].filePath).to.equal('planets/inner/earth');
              } catch (e) {
                return done(e);
              }
              done();          
            });

            mkdirp(newsource);
          }).catch(done);
      });

    });

    context('deleted source files/dirs', function() {

      it('remembers which source for removing keys added after start');

      it('deletes from tree when source deleted (file, no path overlap, nested)',
        // deletes pluto.js (has no overlap with directory or other js files)
        function(done, expect, ntree, SolarSystem, fs, path) {
          var _this = this;
          ntree.create(MOUNT).then(function(tree) {
            _this.tree = tree;

            var deletefile = path.normalize(MOUNT + '/dwarf_planets/pluto.js');
            var tref = tree.dwarf_planets.pluto; // these get deleted when file is deleted
            var vref = tree._vertices.dwarf_planets.pluto;

            delete SolarSystem.dwarf_planets.pluto; // delete from test reference
            
            tree.on('$patch', function(patch) {
              if (patch.doc.path !== '/dwarf_planets/pluto') {
                console.log('unexpected patch', patch);
                return;
              }
              tree._stop();
              try {
                expect(patch).to.eql({
                  doc: {
                    path: '/dwarf_planets/pluto'
                  },
                  patch: [{
                    op: 'remove',
                    path: '',
                    value: {
                      name: 'Pluto',
                      radius: 1186000
                    }
                  }]
                });

                expect(JSON.parse(JSON.stringify(tree))).to.eql(SolarSystem);
                expect(tree._vertices.dwarf_planets.pluto).to.not.exist;

                expect(vref.__.deleted).to.be.true;
                expect(vref.name.__.deleted).to.be.true;
                expect(vref.radius.__.deleted).to.be.true;
              } catch (e) {
                tree._stop();
                return done(e);
              }
              tree._stop();
              done();
            });

            fs.unlink(deletefile, function(err) {
              if (err) return done(err);
            });
          }).catch(done);
      });

      it('deletes from tree when source deleted (file, has path overlap, nested)',
        // deletes inner.js which overlaps paths all the way to inner/earth/radius
        function(done, expect, ntree, SolarSystem, fs, path) {
          var _this = this;
          ntree.create(MOUNT).then(function(tree) {
            _this.tree = tree;

            var deletefile = path.normalize(MOUNT + '/planets/inner.js');
            // these get __partially__ deleted when file is deleted because
            // part of the content comes other (not deleted) files and dirs
            var tref = tree.planets.inner;
            var vref = tree._vertices.planets.inner;
            // console.log(vref);
            // console.log(tref);

            // TODO: new keys added may have been stored in ??? when overlapping paths
            //       !!complicating which should be deleted when overlapping
            //       !!use last file source to determine

            // create expected (post deletion) solar system
            delete SolarSystem.planets.inner.earth.radius;

            tree.on('$patch', function(patch) {
              if (patch.doc.path !== '/planets/inner') {
                console.log('unexpected patch', patch);
                return;
              }
              tree._stop();
              try {

                expect(patch).to.eql({
                  doc: {
                    path: '/planets/inner'
                  },
                  patch: [{
                    op: 'remove',
                    path: '/earth/radius',
                    value: 6371000
                  }]
                });

                expect(JSON.parse(JSON.stringify(tree))).to.eql(SolarSystem);
                expect(tree._vertices.planets.inner.earth.raduis).to.not.exist;

                expect(tree._vertices.planets.inner.__.sources.length).to.equal(2);
                expect(tree._vertices.planets.inner.__.sources[0].filePath).to.equal('planets.js');
                expect(tree._vertices.planets.inner.__.sources[1].filePath).to.equal('planets/inner');

                expect(tree._vertices.planets.inner.earth.__.sources.length).to.equal(1);
                expect(tree._vertices.planets.inner.earth.__.sources[0].filePath).to.equal('planets.js');

                expect(tree._vertices.planets.inner.earth.name.__.sources.length).to.equal(1);
                expect(tree._vertices.planets.inner.earth.name.__.sources[0].filePath).to.equal('planets.js');
              } catch (e) {
                return done(e);
              }
              done();
            });

            fs.unlink(deletefile, function(err) {
              if (err) return done(err);
            });
          }).catch(done);
      });

      it('deletes from tree when source deleted (file, has path overlap, root)',
        // deletes planets.js which overlaps extensively and is a key on the root
        function(done, expect, ntree, SolarSystem, fs, path) {
          var _this = this;
          ntree.create(MOUNT).then(function(tree) {
            _this.tree = tree;

            expect(tree._vertices.planets.__.sources.length).to.equal(2);
            expect(tree._vertices.planets.__.sources[0].filePath).to.equal('planets');
            expect(tree._vertices.planets.__.sources[1].filePath).to.equal('planets.js');

            expect(tree._vertices.planets.inner.__.sources.length).to.equal(3);
            expect(tree._vertices.planets.inner.__.sources[0].filePath).to.equal('planets.js');
            expect(tree._vertices.planets.inner.__.sources[1].filePath).to.equal('planets/inner');
            expect(tree._vertices.planets.inner.__.sources[2].filePath).to.equal('planets/inner.js');

            var deletefile = path.normalize(MOUNT + '/planets.js');

            // create expected (post deletion) solar system
            delete SolarSystem.planets.inner.venus;
            delete SolarSystem.planets.inner.earth.name;
            delete SolarSystem.planets.inner.mars;
            delete SolarSystem.planets.outer.saturn.name;
            delete SolarSystem.planets.outer.uranus;
            delete SolarSystem.planets.outer.neptune.radius; // TODO: name also defined in neptune/name.js (collides???)

            tree.on('$patch', function(patch) {
              if (patch.doc.path !== '/planets') {
                console.log('unexpected patch', patch);
                return;
              }
              tree._stop();
              try {
                expect(patch).to.eql({
                  doc: {
                    path: '/planets'
                  },
                  patch: [
                    {
                      op: 'remove',
                      path: '/inner/venus',
                      value: {
                        name: 'Venus',
                        radius: 6052000
                      }
                    },
                    {
                      op: 'remove',
                      path: '/inner/earth/name',
                      value: 'Earth'
                    },
                    {
                      op: 'remove',
                      path: '/inner/mars',
                      value: {
                        name: 'Mars',
                        radius: 3390000
                      }
                    },
                    {
                      op: 'remove',
                      path: '/outer/saturn/name',
                      value: 'Saturn'
                    },
                    {
                      op: 'remove',
                      path: '/outer/uranus',
                      value: {
                        name: 'Uranus',
                        radius: 25362000
                      }
                    },
                    {
                      op: 'remove',
                      // name still defined in neptune/name.js
                      path: '/outer/neptune/radius',
                      value: 24622000
                    }
                  ]
                });

                expect(JSON.parse(JSON.stringify(tree))).to.eql(SolarSystem);
                expect(tree._vertices.planets.inner.venus).to.not.exist;
                expect(tree._vertices.planets.inner.earth.name).to.not.exist;
                expect(tree._vertices.planets.inner.mars).to.not.exist;
                expect(tree._vertices.planets.outer.saturn.name).to.not.exist;
                expect(tree._vertices.planets.outer.saturn.radius).to.exist;
                expect(tree._vertices.planets.outer.uranus).to.not.exist;
                expect(tree._vertices.planets.outer.neptune.radius).to.not.exist;

                expect(tree._vertices.planets.__.sources.length).to.equal(1);
                expect(tree._vertices.planets.__.sources[0].filePath).to.equal('planets');

                expect(tree._vertices.planets.inner.__.sources.length).to.equal(2);
                expect(tree._vertices.planets.inner.__.sources[0].filePath).to.equal('planets/inner');
                expect(tree._vertices.planets.inner.__.sources[1].filePath).to.equal('planets/inner.js');
              } catch (e) {
                return done(e);
              }
              done();
            });

            fs.unlink(deletefile, function(err) {
              if (err) return done(err);
            });
          }).catch(done);
      });

      it('deletes from tree when source deleted (directory, no overlap, nested)',
        // deletes dwarf_planets/makemake which has no overlaps defined in ancestor
        function(done, expect, ntree, SolarSystem, rimraf, path) {
          var _this = this;
          ntree.create(MOUNT).then(function(tree) {
            _this.tree = tree;

            var deletefile = path.normalize(MOUNT + '/dwarf_planets/makemake');

            // create expected (post deletion) solar system
            delete SolarSystem.dwarf_planets.makemake;

            var patched = [];
            tree.on('$patch', function(patch) {
              if (patch.doc.path.indexOf('/dwarf_planets/makemake') !== 0) {
                console.log('unexpected patch', patch);
                return;
              }
              patched.push(patch);
            });

            tree.on('$unload', function(source) {
              if (source.filename !== deletefile) return;
              tree._stop();
              try {

                // TODO: single delete of dir results in multiple emits, a way to not?
                expect(patched).to.eql([
                  {
                    doc: {
                      path: '/dwarf_planets/makemake/name'
                    },
                    patch: [{
                      op: 'remove',
                      path: '',
                      value: 'Makemake'
                    }]
                  },
                  {
                    doc: {
                      path: '/dwarf_planets/makemake/radius'
                    },
                    patch: [{
                      op: 'remove',
                      path: '',
                      value: 739000
                    }]
                  },
                  {
                    doc: {
                      path: '/dwarf_planets/makemake'
                    },
                    patch: [{
                      op: 'remove',
                      path: '',
                      value: {}
                    }]
                  }
                ])

                expect(JSON.parse(JSON.stringify(tree))).to.eql(SolarSystem);
                expect(tree._vertices.dwarf_planets.makemake).to.not.exist;
              } catch (e) {
                return done(e);
              }
              done();
            });

            rimraf(deletefile, function(err) {
              if (err) return done(err);
            });
          }).catch(done);
      });

      it('deletes from tree when source deleted (directory, no overlap, root)',
        // deletes dwarf_planets which has no overlaps defined in ancestor and is a key on root
        function(done, expect, ntree, SolarSystem, rimraf, path) {
          var _this = this;
          ntree.create(MOUNT).then(function(tree) {
            _this.tree = tree;

            var deletefile = path.normalize(MOUNT + '/dwarf_planets');

            // create expected (post deletion) solar system
            delete SolarSystem.dwarf_planets;

            var patched = [];
            tree.on('$patch', function(patch) {
              if (patch.doc.path.indexOf('/dwarf_planets') !== 0) {
                console.log('unexpected patch', patch);
                return;
              }
              patched.push(patch);
            });

            tree.on('$unload', function(source) {
              if (source.filename !== deletefile) return;
              tree._stop();
              try {

                expect(patched).to.eql([
                  {
                    doc: {
                      path: "/dwarf_planets/eris"
                    },
                    patch: [
                      {
                        op: "remove",
                        path: "",
                        value: {
                          name: "Eris",
                          radius: 1163000
                        }
                      }
                    ]
                  },
                  {
                    doc: {
                      path: "/dwarf_planets/pluto"
                    },
                    patch: [
                      {
                        op: "remove",
                        path: "",
                        value: {
                          name: "Pluto",
                          radius: 1186000
                        }
                      }
                    ]
                  },
                  {
                    doc: {
                      path: "/dwarf_planets/makemake/name"
                    },
                    patch: [
                      {
                        op: "remove",
                        path: "",
                        value: "Makemake"
                      }
                    ]
                  },
                  {
                    doc: {
                      path: "/dwarf_planets/makemake/radius"
                    },
                    patch: [
                      {
                        op: "remove",
                        path: "",
                        value: 739000
                      }
                    ]
                  },
                  {
                    doc: {
                      path: "/dwarf_planets/makemake"
                    },
                    patch: [
                      {
                        op: "remove",
                        path: "",
                        value: {}
                      }
                    ]
                  },
                  {
                    doc: {
                      path: "/dwarf_planets"
                    },
                    patch: [
                      {
                        op: "remove",
                        path: "",
                        value: {}
                      }
                    ]
                  }
                ]);

                expect(JSON.parse(JSON.stringify(tree))).to.eql(SolarSystem);
                expect(tree._vertices.dwarf_planets).to.not.exist;
              } catch (e) {
                return done(e);
              }
              done();
            });

            rimraf(deletefile, function(err) {
              if (err) return done(err);
            });
          }).catch(done);
      });

      it('deletes from tree when source deleted (directory, has path overlap, nested)',
        // deletes planets/inner which has much overlap defined in ancestor
        function(done, expect, ntree, SolarSystem, rimraf, path) {
          var _this = this;
          ntree.create(MOUNT).then(function(tree) {
            _this.tree = tree;

            var deletefile = path.normalize(MOUNT + '/planets/inner');

            // create expected (post deletion) solar system
            delete SolarSystem.planets.inner.mercury;

            var patched = [];
            tree.on('$patch', function(patch) {
              if (patch.doc.path.indexOf('/planets/inner/mercury') !== 0) {
                console.log('unexpected patch', patch);
                return;
              }
              patched.push(patch);
            });

            tree.on('$unload', function(source) {
              if (source.filename !== deletefile) return;
              tree._stop();
              try {

                expect(patched).to.eql([
                  {
                    doc: {
                      path: '/planets/inner/mercury'
                    },
                    patch: [
                      {
                        op: 'remove',
                        path: '',
                        value: {
                          name: 'Mercury',
                          radius: 2440000
                        }
                      }
                    ]
                  },
                  // { // still defined in planets and inner.js
                  //   doc: 'planets/inner',
                  //   patch: [{
                  //     op: 'remove',
                  //     path: '',
                  //     value: {}
                  //   }]
                  // }
                ]);

                expect(JSON.parse(JSON.stringify(tree))).to.eql(SolarSystem);
                expect(tree._vertices.planets.inner.mercury).to.not.exist;

                expect(tree._vertices.planets.inner.__.sources.length).to.equal(2);
                expect(tree._vertices.planets.inner.__.sources[0].filePath).to.equal('planets.js');
                expect(tree._vertices.planets.inner.__.sources[1].filePath).to.equal('planets/inner.js');
              } catch (e) {
                return done(e);
              }
              done();
            });

            rimraf(deletefile, function(err) {
              if (err) return done(err);
            });
          }).catch(done);
      });

      it('deletes from tree when source deleted (directory, no path overlap, root)',
        // deletes sun which has overlaps defined in ancestor and is a key on root
        function(done, expect, ntree, SolarSystem, rimraf, path) {
          var _this = this;
          ntree.create(MOUNT).then(function(tree) {
            _this.tree = tree;

            var deletefile = path.normalize(MOUNT + '/sun');

            // create expected (post deletion) solar system
            delete SolarSystem.sun.radius;

            var patched = [];
            tree.on('$patch', function(patch) {
              patched.push(patch);
            });

            tree.on('$unload', function(source) {
              if (source.filename !== deletefile) return;
              tree._stop();
              try {

                expect(patched).to.eql([
                  {
                    doc: {
                      path: '/sun/radius'
                    },
                    patch: [{
                      op: 'remove',
                      path: '',
                      value: 696000000
                    }]
                  }
                ]);

                expect(JSON.parse(JSON.stringify(tree))).to.eql(SolarSystem);
                expect(tree._vertices.sun.radius).to.not.exist;

                expect(tree._vertices.sun.__.sources.length).to.equal(1);
                expect(tree._vertices.sun.__.sources[0].filePath).to.equal('sun.js');
                // expect(tree._vertices.planets.inner.__.sources[1].filePath).to.equal('planets/inner.js');
              } catch (e) {
                return done(e);
              }
              done();
            });

            rimraf(deletefile, function(err) {
              if (err) return done(err);
            });
          }).catch(done);
      });

    });


  });


});
