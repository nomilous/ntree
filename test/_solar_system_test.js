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

  beforeEach(function() {
    mock('config', {
      mount: MOUNT,
      onError: function(e) {
        // console.log(e);  
      },
      patch: {}
    });
  });

  afterEach(function() {
    // when some of the tests fail thay can leave the tree active
    // and then events are fired on the cleanup deletions from _temp 
    if (this.tree) this.tree._stop();


    // this.timeout(4000);
    // setTimeout(done, 3000);
  });


  it('loads the solar system ok',
    function(done, config, expect, ntree, SolarSystem) {
      ntree.create(config).then(function(tree) {
        expect(JSON.parse(JSON.stringify(tree))).to.eql(SolarSystem);
        tree._stop();
        done();
      }).catch(done);
  });


  context('syncIn (changes originating on disk)', function() {

    context('changed source files', function() {
      
      context('updates tree (file, no overlap)', function() {

        it('emits empty patch if no change (single key)',
          function(done, config, expect, ntree, SolarSystem, fxt, fs, path) {
            var _this = this;
            ntree.create(config).then(function(tree) {
              _this.tree = tree;
              var changesource = path.normalize(MOUNT + '/sun/radius.js');
              var content = fxt(function() {/*
                module.exports = 696000000;
              */});

              tree.on('$patch', function(patch) {
                try {
                  expect(JSON.parse(JSON.stringify(tree))).to.eql(SolarSystem);
                  expect(patch).to.eql({
                    doc: {
                      path: '/sun/radius'
                    },
                    patch: []
                  });
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

        it('changes key and emits patch (single key)',
          function(done, config, expect, ntree, SolarSystem, fxt, fs, path) {
            var _this = this;
            ntree.create(config).then(function(tree) {
              _this.tree = tree;
              var changesource = path.normalize(MOUNT + '/sun/radius.js');
              var content = fxt(function() {/*
                module.exports = 0;
              */});
              SolarSystem.sun.radius = 0;

              tree.on('$patch', function(patch) {
                try {
                  expect(JSON.parse(JSON.stringify(tree))).to.eql(SolarSystem);
                  expect(patch).to.eql({
                    doc: {
                      path: '/sun/radius'
                    },
                    patch: [{
                      op: 'replace',
                      path: '',
                      value: 0
                    }]
                  });
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

        it('emits empty patch if no change (multiple key, no overlap)',
          function(done, config, expect, ntree, SolarSystem, fxt, fs, path) {
            var _this = this;
            ntree.create(config).then(function(tree) {
              _this.tree = tree;
              var changesource = path.normalize(MOUNT + '/dwarf_planets/eris.js');
              var content = fxt(function() {/*
                module.exports = {
                  name: 'Eris',
                  radius: 1163000
                };
              */});

              tree.on('$patch', function(patch) {
                try {
                  expect(JSON.parse(JSON.stringify(tree))).to.eql(SolarSystem);
                  expect(patch).to.eql({
                    doc: {
                      path: '/dwarf_planets/eris'
                    },
                    patch: []
                  });
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

        it('emits patch if change (multiple key, no overlap)',
          function(done, config, expect, ntree, SolarSystem, fxt, fs, path) {
            config.patch.previous = true;
            var _this = this;
            ntree.create(config).then(function(tree) {
              _this.tree = tree;

              var changesource = path.normalize(MOUNT + '/planets/inner/mercury.js');
              var content = fxt(function() {/*
                module.exports = {
                  name: 'Quicksilver',
                  radius: 2440000
                }
              */});

              SolarSystem.planets.inner.mercury.name = 'Quicksilver';

              tree.on('$patch', function(patch) {
                try {
                  expect(JSON.parse(JSON.stringify(tree))).to.eql(SolarSystem);
                  expect(patch).to.eql({
                    doc: {
                      path: '/planets/inner/mercury'
                    },
                    patch: [{
                      op: 'replace',
                      path: '/name',
                      value: 'Quicksilver',
                      previous: 'Mercury'
                    }]
                  })
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

        it('adds new keys (updates vtree) and emits patch (no overlap)',
          function(done, config, expect, ntree, SolarSystem, fxt, fs, path) {
            config.patch.previous = true;
            var _this = this;
            ntree.create(config).then(function(tree) {
              _this.tree = tree;

              var changesource = path.normalize(MOUNT + '/planets/inner/mercury.js');
              var content = fxt(function() {/*
                module.exports = {
                  name: 'Mercury',
                  radius: {
                    value: 2440000,
                    unit: 'meters'
                  },
                  mass: {
                    value: 0.055,
                    unit: 'earths'
                  },
                  gravity: '0.38g'
                }
              */});

              SolarSystem.planets.inner.mercury = {
                name: 'Mercury',
                radius: {
                  value: 2440000,
                  unit: 'meters'
                },
                mass: {
                  value: 0.055,
                  unit: 'earths'
                },
                gravity: '0.38g'
              }

              tree.on('$patch', function(patch) {
                try {
                  expect(JSON.parse(JSON.stringify(tree))).to.eql(SolarSystem);
                  expect(patch).to.eql({
                    doc: {
                      path: '/planets/inner/mercury'
                    },
                    patch: [{
                      op: 'replace',
                      path: '/radius',
                      value: {
                        value: 2440000,
                        unit: 'meters'
                      },
                      previous: 2440000
                    }, {
                      op: 'add',
                      path: '/mass',
                      value: {
                        value: 0.055,
                        unit: 'earths'
                      }
                    }, {
                      op: 'add',
                      path: '/gravity',
                      value: '0.38g'
                    }]
                  });

                  var vmercury = tree._vertices.planets.inner.mercury;
                  expect(vmercury.__.sources.length).to.equal(1);
                  expect(vmercury.name.__.sources.length).to.equal(1);
                  expect(vmercury.radius.value.__.sources.length).to.equal(1);
                  expect(vmercury.radius.unit.__.sources.length).to.equal(1);
                  expect(vmercury.mass.value.__.sources.length).to.equal(1);
                  expect(vmercury.mass.unit.__.sources.length).to.equal(1);
                  expect(vmercury.gravity.__.sources.length).to.equal(1);

                  var msource = vmercury.__.sources[0];
                  // expect(vmercury.__.sources[0]).to.equal(msource);
                  expect(vmercury.name.__.sources[0]).to.equal(msource);
                  expect(vmercury.radius.value.__.sources[0]).to.equal(msource);
                  expect(vmercury.radius.unit.__.sources[0]).to.equal(msource);
                  expect(vmercury.mass.value.__.sources[0]).to.equal(msource);
                  expect(vmercury.mass.unit.__.sources[0]).to.equal(msource);
                  expect(vmercury.gravity.__.sources[0]).to.equal(msource);     

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

        it('removes keys (updates vtree) and emits patch (root)',
          function(done, config, expect, ntree, SolarSystem, fxt, fs, path) {
            config.patch.previous = true;
            var _this = this;
            ntree.create(config).then(function(tree) {
              _this.tree = tree;

              var changesource = path.normalize(MOUNT + '/planets/inner/mercury.js');
              var content = fxt(function() {/*
                module.exports = {
                  radius: 2440000
                }
              */});

              delete SolarSystem.planets.inner.mercury.name;

              tree.on('$patch', function(patch) {
                try {
                  expect(JSON.parse(JSON.stringify(tree))).to.eql(SolarSystem);
                  expect(patch).to.eql({
                    doc: {
                      path: '/planets/inner/mercury'
                    },
                    patch: [{
                      op: 'remove',
                      path: '/name',
                      previous: 'Mercury'
                    }]
                  })
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

        it('removes keys (updates vtree) and emits patch (nested)',
          function(done, config, expect, ntree, SolarSystem, fxt, fs, path) {
            config.patch.previous = true;
            var _this = this;
            ntree.create(config).then(function(tree) {
              _this.tree = tree;

              var changesource = path.normalize(MOUNT + '/planets.js');
              var content = fxt(function() {/*
                module.exports = {
                  inner: {
                    // // a quite complicated update!!
                    // // especially because planets.js:/inner overlaps with
                    // //              file: planets/inner.js
                    // //           and dir: planets/inner/
                    // //
                    // // runs the delete in vertex.updateKey()
                    // //
                    // venus: { // getKeysWithOnlyThisSource()
                    //   name: 'Venus',
                    //   radius: 6052000
                    // },
                    // earth: {  // getKeysWithThisAndOtherSources()
                    //   name: 'Earth' // getNestedVerticesWithOnlyThisSource()
                    // },
                    // mars: { // getKeysWithOnlyThisSource
                    //   name: 'Mars',
                    //   radius: 3390000
                    // }
                  },
                  outer: {
                    saturn: {
                      name: 'Saturn'
                    },
                    uranus: {
                      name: 'Uranus',
                      radius: 25362000
                    },
                    neptune: {
                      name: 'Neptune',
                      radius: 24622000
                    }
                  }
                }
              */});

              delete SolarSystem.planets.inner.venus;
              delete SolarSystem.planets.inner.earth.name;
              delete SolarSystem.planets.inner.mars;

              tree.on('$patch', function(patch) {
                try {
                  expect(JSON.parse(JSON.stringify(tree))).to.eql(SolarSystem);
                  expect(patch).to.eql({
                    doc: {
                      path: '/planets'
                    },
                    patch: [{
                      op: 'remove',
                      path: '/inner/venus',
                      previous: {
                        name: 'Venus',
                        radius: 6052000
                      }
                    }, {
                      op: 'remove',
                      path: '/inner/mars',
                      previous: {
                        name: 'Mars',
                        radius: 3390000
                      },
                    }, {
                      op: 'remove',
                      path: '/inner/earth/name',
                      previous: 'Earth'
                    }]
                  });

                  expect(tree._vertices.planets.inner.venus).to.not.exist;
                  expect(tree._vertices.planets.inner.mars).to.not.exist;
                  expect(tree._vertices.planets.inner.earth.name).to.not.exist;

                  expect(tree._vertices.planets.__.sources.map(function(s) {
                    return s.filePath;
                  })).to.eql(['planets', 'planets.js']);

                  expect(tree._vertices.planets.inner.__.sources.map(function(s) {
                    return s.filePath;
                  })).to.eql(['planets.js', 'planets/inner', 'planets/inner.js']);

                  expect(tree._vertices.planets.inner.earth.__.sources.map(function(s) {
                    return s.filePath;
                  })).to.eql(['planets/inner.js']);

                  expect(tree._vertices.planets.inner.earth.name).to.not.exist;
                  
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

        it('removes keys (updates vtree) and emits patch (root)',
          function(done, config, expect, ntree, SolarSystem, fxt, fs, path) {
            config.patch.previous = true;
            var _this = this;
            ntree.create(config).then(function(tree) {
              _this.tree = tree;

              var changesource = path.normalize(MOUNT + '/planets.js');
              var content = fxt(function() {/*
                module.exports = {
                  //
                  // same as previous test but removes entire inner branch
                  // runs delete in vertex.updateSource()
                  //
                  //inner: {
                    // venus: {
                    //   name: 'Venus',
                    //   radius: 6052000
                    // },
                    // earth: {
                    //   name: 'Earth'
                    // },
                    // mars: {
                    //   name: 'Mars',
                    //   radius: 3390000
                    // }
                  //},
                  outer: {
                    saturn: {
                      name: 'Saturn'
                    },
                    uranus: {
                      name: 'Uranus',
                      radius: 25362000
                    },
                    neptune: {
                      name: 'Neptune',
                      radius: 24622000
                    }
                  }
                }
              */});

              delete SolarSystem.planets.inner.venus;
              delete SolarSystem.planets.inner.earth.name;
              delete SolarSystem.planets.inner.mars;

              tree.on('$patch', function(patch) {
                try {
                  expect(JSON.parse(JSON.stringify(tree))).to.eql(SolarSystem);
                  expect(patch).to.eql({
                    doc: {
                      path: '/planets'
                    },
                    patch: [{
                      op: 'remove',
                      path: '/inner/mars',
                      previous: {
                        name: 'Mars',
                        radius: 3390000
                      },
                    }, {
                      op: 'remove',
                      path: '/inner/earth/name',
                      previous: 'Earth'
                    }, {
                      op: 'remove',
                      path: '/inner/venus',
                      previous: {
                        name: 'Venus',
                        radius: 6052000
                      }
                    }]
                  });

                  expect(tree._vertices.planets.inner.venus).to.not.exist;
                  expect(tree._vertices.planets.inner.mars).to.not.exist;
                  expect(tree._vertices.planets.inner.earth.name).to.not.exist;

                  expect(tree._vertices.planets.__.sources.map(function(s) {
                    return s.filePath;
                  })).to.eql(['planets', 'planets.js']);

                  expect(tree._vertices.planets.inner.__.sources.map(function(s) {
                    return s.filePath;
                  })).to.eql(['planets/inner', 'planets/inner.js']);

                  expect(tree._vertices.planets.inner.earth.__.sources.map(function(s) {
                    return s.filePath;
                  })).to.eql(['planets/inner.js']);

                  expect(tree._vertices.planets.inner.earth.name).to.not.exist;

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

      });

      context('updates tree (file, with overlap)', function() {

        it('emits empty patch if no change (multiple key, with overlap)',
          function(done, config, expect, ntree, SolarSystem, fxt, fs, path) {
            var _this = this;
            config.patch.previous = true;
            ntree.create(config).then(function(tree) {
              _this.tree = tree;

              var changesource = path.normalize(MOUNT + '/planets.js');
              var content = fxt(function() {/*
                module.exports = {
                  inner: {
                    venus: {
                      name: 'Venus',
                      radius: 6052000
                    },
                    earth: {
                      name: 'Earth'
                    },
                    mars: {
                      name: 'Mars',
                      radius: 3390000
                    }
                  },
                  outer: {
                    saturn: {
                      name: 'Saturn'
                    },
                    uranus: {
                      name: 'Uranus',
                      radius: 25362000
                    },
                    neptune: {
                      name: 'Neptune',
                      radius: 24622000
                    }
                  }
                }
              */});

              tree.on('$patch', function(patch) {
                try {
                  expect(JSON.parse(JSON.stringify(tree))).to.eql(SolarSystem);
                  expect(patch).to.eql({
                    doc: {
                      path: '/planets'
                    },
                    patch: []
                  });
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

        it('emits patch with change (multiple key, with overlap)',
          function(done, config, expect, ntree, SolarSystem, fxt, fs, path) {
            var _this = this;
            // config.patch.previous = true;
            ntree.create(config).then(function(tree) {
              _this.tree = tree;
              var changesource = path.normalize(MOUNT + '/planets.js');
              var content = fxt(function() {/*
                module.exports = {
                  inner: {
                    venus: {
                      name: 'Aphrodite',
                      radius: 6052000
                    },
                    earth: {
                      name: 'Earth'
                    },
                    mars: {
                      name: 'Ares',
                      radius: 3390000
                    }
                  },
                  outer: {
                    saturn: {
                      name: 'Kronos'
                    },
                    uranus: {
                      name: 'Uranus',
                      radius: 25362000
                    },
                    neptune: {
                      name: 'Poseidon',
                      radius: 24622000
                    }
                  }
                }
              */});

              SolarSystem.planets.inner.venus.name = 'Aphrodite';
              SolarSystem.planets.inner.mars.name = 'Ares';
              SolarSystem.planets.outer.saturn.name = 'Kronos';
              SolarSystem.planets.outer.neptune.name = 'Poseidon';

              tree.on('$patch', function(patch) {
                try {
                  expect(JSON.parse(JSON.stringify(tree))).to.eql(SolarSystem);
                  expect(patch).to.eql({
                    doc: {
                      path: '/planets'
                    },
                    patch: [{
                      op: 'replace',
                      path: '/inner/venus/name',
                      value: 'Aphrodite' 
                    }, {
                      op: 'replace',
                      path: '/inner/mars/name',
                      value: 'Ares'
                    }, {
                      op: 'replace',
                      path: '/outer/saturn/name',
                      value: 'Kronos'
                    }, {
                      op: 'replace',
                      path: '/outer/neptune/name',
                      value: 'Poseidon'
                    }]
                  });
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

        it('emits patch with change and errors (multiple key, with overlap)',
          function(done, config, expect, ntree, SolarSystem, fxt, fs, path) {
            var _this = this;
            ntree.create(config).then(function(tree) {
              _this.tree = tree;

              var changesource = path.normalize(MOUNT + '/planets.js');
              var content = fxt(function() {/*
                module.exports = {
                  inner: {
                    venus: {
                      name: 'Aphrodite',
                      radius: 6052000
                    },
                    earth: {
                      name: 'Earth'
                    },
                    mars: {
                      name: 'Ares',
                      radius: 3390000
                    }
                  },
                  outer: {
                    jupiter: {
                      name: 'Zeus' // cannot change, originally defined in planets/outer/jupiter/name.js
                    },
                    saturn: {
                      name: 'Kronos'
                    },
                    uranus: {
                      name: 'Uranus',
                      radius: 25362000
                    },
                    neptune: {
                      name: 'Poseidon',
                      radius: 24622000
                    }
                  }
                }
              */});

              SolarSystem.planets.inner.venus.name = 'Aphrodite';
              SolarSystem.planets.inner.mars.name = 'Ares';
              SolarSystem.planets.outer.saturn.name = 'Kronos';
              SolarSystem.planets.outer.neptune.name = 'Poseidon';

              var error;
              tree.on('$error', function(e) {
                error = e;
              });

              tree.on('$patch', function(patch) {
                try {
                  expect(JSON.parse(JSON.stringify(tree))).to.eql(SolarSystem);
                  expect(patch).to.eql({
                    doc: {
                      path: '/planets'
                    },
                    patch: [{
                      op: 'replace',
                      path: '/inner/venus/name',
                      value: 'Aphrodite' 
                    }, {
                      op: 'replace',
                      path: '/inner/mars/name',
                      value: 'Ares'
                    }, {
                      op: 'replace',
                      path: '/outer/saturn/name',
                      value: 'Kronos'
                    }, {
                      op: 'replace',
                      path: '/outer/neptune/name',
                      value: 'Poseidon'
                    }]
                  });
                } catch (e) {
                  tree._stop();
                  return done(e);
                }

                setTimeout(function() {
                  tree._stop();
                  expect(error.toString()).to.equal('MultipleSourceError: planets/outer/jupiter/name');
                  expect(error.info.original.filePath).to.equal('planets/outer/jupiter/name.js');
                  expect(error.info.duplicate.filePath).to.equal('planets.js');
                  done();
                }, 50);
              });

              fs.writeFileSync(changesource, content);
            }).catch(done);
        });

        it('adds keys on overlap (nested)',
          function(done, config, expect, ntree, SolarSystem, fxt, fs, path) {
            var _this = this;
            ntree.create(config).then(function(tree) {
              _this.tree = tree;

              var changesource = path.normalize(MOUNT + '/planets.js');
              var content = fxt(function() {/*
                module.exports = {
                  inner: {
                    venus: {
                      name: 'Venus',
                      radius: 6052000
                    },
                    earth: {
                      name: 'Earth'
                    },
                    mars: {
                      name: 'Mars',
                      radius: 3390000
                    }
                  },
                  outer: {
                    saturn: {
                      name: 'Saturn'
                    },
                    uranus: {
                      name: 'Uranus',
                      radius: 25362000
                    },
                    neptune: {
                      name: 'Neptune',
                      radius: 24622000
                    },
                    pluto: {
                      name: 'Pluto',
                      radius: 1186000
                    }
                  }
                }
              */});

              SolarSystem.planets.outer.pluto = {
                name: 'Pluto',
                radius: 1186000
              }

              tree.on('$patch', function(patch) {
                try {
                  expect(JSON.parse(JSON.stringify(tree))).to.eql(SolarSystem);
                  expect(patch).to.eql({
                    doc: {
                      path: '/planets'
                    },
                    patch: [{
                      op: 'add',
                      path: '/outer/pluto',
                      value: {
                        name: 'Pluto',
                        radius: 1186000
                      }
                    }]
                  });
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


        it('adds keys on overlap (nested)',
          function(done, config, expect, ntree, SolarSystem, fxt, fs, path) {
            var _this = this;
            ntree.create(config).then(function(tree) {
              _this.tree = tree;

              var changesource = path.normalize(MOUNT + '/planets.js');
              var content = fxt(function() {/*
                module.exports = {
                  inner: {
                    venus: {
                      name: 'Venus',
                      radius: 6052000
                    },
                    earth: {
                      name: 'Earth'
                    },
                    mars: {
                      name: 'Mars',
                      radius: 3390000
                    }
                  },
                  trojan: {
                    untitled: {
                      name: 'Untitled',
                      radius: 1 / Infinity
                    }
                  },
                  outer: {
                    saturn: {
                      name: 'Saturn'
                    },
                    uranus: {
                      name: 'Uranus',
                      radius: 25362000
                    },
                    neptune: {
                      name: 'Neptune',
                      radius: 24622000
                    }
                  }
                }
              */});

              SolarSystem.planets.trojan = {
                untitled: {
                  name: 'Untitled',
                  radius: 1 / Infinity
                }
              };

              tree.on('$patch', function(patch) {
                try {
                  expect(JSON.parse(JSON.stringify(tree))).to.eql(SolarSystem);
                  expect(patch).to.eql({
                    doc: {
                      path: '/planets'
                    },
                    patch: [{
                      op: 'add',
                      path: '/trojan',
                      value: {
                        untitled: {
                          name: 'Untitled',
                          radius: 1 / Infinity
                        }
                      }
                    }]
                  });

                  expect(tree._vertices.planets.trojan.untitled.__.sources.length).to.equal(1);
                  expect(tree._vertices.planets.trojan.untitled.__.sources[0].filePath).to.equal('planets.js');
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

        it('errors on added key already defined from another source',
          function(done, config, expect, ntree, SolarSystem, fxt, fs, path, MultipleSourceError) {
            var _this = this;
            ntree.create(config).then(function(tree) {
              _this.tree = tree;

              var changesource = path.normalize(MOUNT + '/planets/inner.js');
              var content = fxt(function() {/*
                module.exports = {
                  earth: {
                    radius: 6371000,
                    name: 'Earth' // cause MultipleSourceError, already defined in planets.js
                  }
                }
              */});

              var patched;
              tree.on('$patch', function(patch) {
                // TODO: error into patch
                patched = patch;
              });

              tree.on('$error', function(e) {
                expect(e).to.be.an.instanceof(MultipleSourceError);
                expect(e.info.original.filePath).to.equal('planets.js');
                expect(e.info.duplicate.filePath).to.equal('planets/inner.js');
                expect(e.info.route).to.eql(['planets', 'inner', 'earth', 'name']);

                setTimeout(function() {
                  tree._stop();
                  expect(patched).to.eql({
                    doc: {
                      path: '/planets/inner'
                    },
                    patch: []
                  });
                  done();
                }, 50);
              });

              fs.writeFileSync(changesource, content);
            }).catch(done);
        });

      });

    });

    context('new source files/dirs', function() {

      it('adds to tree (file, no overlap)',
        function(done, config, expect, ntree, SolarSystem, fxt, fs, path) {
          var _this = this;
          ntree.create(config).then(function(tree) {
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

            SolarSystem.planets.outer.jupiter.moons = {
              europa: {},
              io: {},
              ganymede: {},
              callisto: {}
            }

            tree.on('$patch', function(patch) {

              if (patch.doc.path !== '/planets/outer/jupiter/moons') {
                console.log('unexpected patch', patch);
                return;
              }

              try {
                expect(JSON.parse(JSON.stringify(tree))).to.eql(SolarSystem);
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
        function(done, config, expect, ntree, SolarSystem, fxt, fs, path) {
          var _this = this;
          ntree.create(config).then(function(tree) {
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

            SolarSystem.planets.outer.jupiter.moons = {
              europa: {},
              io: {},
              ganymede: {},
              callisto: {}
            }

            tree.on('$patch', function(patch) {
              if (patch.doc.path !== '/planets/outer') {
                console.log('unexpected patch', patch);
                return;
              }
              try {
                expect(JSON.parse(JSON.stringify(tree))).to.eql(SolarSystem);
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
        function(done, config, expect, ntree, SolarSystem, mkdirp, path) {
          var _this = this;
          ntree.create(config).then(function(tree) {
            _this.tree = tree;
            
            var newsource = path.normalize(MOUNT + '/planets/outer/jupiter/moons');

            SolarSystem.planets.outer.jupiter.moons = {};

            tree.on('$patch', function(patch) {
              if (patch.doc.path !== '/planets/outer/jupiter/moons') {
                console.log('unexpected patch', patch);
                return;
              }
              try {
                expect(JSON.parse(JSON.stringify(tree))).to.eql(SolarSystem);
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
        function(done, config, expect, ntree, SolarSystem, mkdirp, path) {
          var _this = this;
          config.patch.noop = true // only emits patch if patch.noop is enabled
          ntree.create(config).then(function(tree) {
            _this.tree = tree;
            
            var newsource = path.normalize(MOUNT + '/planets/inner/earth');

            tree.on('$patch', function(patch) {
              if (patch.doc.path !== '/planets/inner/earth') {
                console.log('unexpected patch', patch);
                return;
              }
              tree._stop();
              try {
                expect(JSON.parse(JSON.stringify(tree))).to.eql(SolarSystem);
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
        function(done, config, expect, ntree, SolarSystem, fs, path) {
          var _this = this;
          ntree.create(config).then(function(tree) {
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
                    path: ''
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
        function(done, config, expect, ntree, SolarSystem, fs, path) {
          var _this = this;
          ntree.create(config).then(function(tree) {
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
                    path: '/earth/radius'
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
        function(done, config, expect, ntree, SolarSystem, fs, path) {
          var _this = this;
          config.patch.previous = true;
          ntree.create(config).then(function(tree) {
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
            delete SolarSystem.planets.outer.neptune.name; // neptune = {} remains (defined directory)
            delete SolarSystem.planets.outer.neptune.radius;

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
                      previous: {
                        name: 'Venus',
                        radius: 6052000
                      }
                    },
                    {
                      op: 'remove',
                      path: '/inner/earth/name',
                      previous: 'Earth'
                    },
                    {
                      op: 'remove',
                      path: '/inner/mars',
                      previous: {
                        name: 'Mars',
                        radius: 3390000
                      }
                    },
                    {
                      op: 'remove',
                      path: '/outer/saturn/name',
                      previous: 'Saturn'
                    },
                    {
                      op: 'remove',
                      path: '/outer/uranus',
                      previous: {
                        name: 'Uranus',
                        radius: 25362000
                      }
                    },
                    {
                      op: 'remove',
                      path: '/outer/neptune/name',
                      previous: 'Neptune'
                    },
                    {
                      op: 'remove',
                      path: '/outer/neptune/radius',
                      previous: 24622000
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
        function(done, config, expect, ntree, SolarSystem, rimraf, path) {
          var _this = this;
          ntree.create(config).then(function(tree) {
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
                      // value: 'Makemake'
                    }]
                  },
                  {
                    doc: {
                      path: '/dwarf_planets/makemake/radius'
                    },
                    patch: [{
                      op: 'remove',
                      path: '',
                      // value: 739000
                    }]
                  },
                  {
                    doc: {
                      path: '/dwarf_planets/makemake'
                    },
                    patch: [{
                      op: 'remove',
                      path: '',
                      // value: {}
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
        function(done, config, expect, ntree, SolarSystem, rimraf, path) {
          var _this = this;
          config.patch.previous = true;
          ntree.create(config).then(function(tree) {
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
                        previous: {
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
                        previous: {
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
                        previous: "Makemake"
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
                        previous: 739000
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
                        previous: {}
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
                        previous: {}
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
        function(done, config, expect, ntree, SolarSystem, rimraf, path) {
          var _this = this;
          config.patch.previous = true;
          ntree.create(config).then(function(tree) {
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
                        previous: {
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
        function(done, config, expect, ntree, SolarSystem, rimraf, path) {
          var _this = this;
          config.patch.previous = true;
          ntree.create(config).then(function(tree) {
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
                      previous: 696000000
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

  context.only('syncOut (changes originating in tree)', function() {

    context('adding keys (detected by scan)', function() {

      context('no overlap', function() {

        it('assigns correct source, writes file and emits patch 1',
          function(done, config, ntree, expect, fs, path) {
            var _this = this;
            // config...
            ntree.create(config).then(function(tree) {
              _this.tree = tree;

              var sourceFile = path.normalize(MOUNT + '/dwarf_planets/eris.js');

              tree.on('$patch', function(patch) {
                try {
                  expect(patch).to.eql({
                    doc: {
                      path: '/dwarf_planets/eris'
                    },
                    patch: [{
                      op: 'add',
                      path: '/year',
                      value: '560.9 Earth Years'
                    }]
                  });

                  expect(tree._vertices.dwarf_planets.eris.year).to.exist;
                  expect(tree._vertices.dwarf_planets.eris.year.__).to.exist;
                  expect(tree._vertices.dwarf_planets.eris.year.__.sources.length).to.equal(1);
                  expect(tree._vertices.dwarf_planets.eris.year.__.sources[0].filePath).to.equal('dwarf_planets/eris.js');
                  expect(tree.dwarf_planets.eris.year).to.equal('560.9 Earth Years');

                  delete require.cache[sourceFile];
                  var source = require(sourceFile);

                  expect(source).to.eql({
                    name: 'Eris',
                    radius: 1163000,
                    year: '560.9 Earth Years'
                  });

                } catch (e) {
                  tree._stop();
                  return done(e);
                }
                tree._stop();
                done();
              });

              tree.dwarf_planets.eris.year = '560.9 Earth Years';

            }).catch(done);
        });

      });

      context('with overlap', function() {

        context('onMultiple last', function() {

          xit('assigns correct source, writes file and emits patch 2');

        });

        context('onMultiple first', function() {

          xit('assigns correct source, writes file and emits patch 3');

        });

      });

    });

    context('deleting keys (detected by scan)', function() {

      context('no overlap', function() {

        context('value', function() {

          xit('emits patch, removes vertex and updates file 1', function() {

          });

          xit('ignores file change (no inbound "sync echo") 1', function() {

          });

        });

        context('branch', function() {

          xit('emits patch, removes vertex branch and updates file 2', function() {

          });

          xit('ignores file change (no inbound "sync echo") 2', function() {

          });

        });

      });

      context('with overlap', function() {

        context('value', function() {

          xit('emits patch and updates file 3', function() {

          });

          xit('ignores file change (no inbound "sync echo") 3', function() {

          });

        });

        context('branch', function() {

          xit('emits patch and updates multiple files 4', function() {

          });

          xit('ignores file change (no inbound "sync echo") 4', function() {

          });

        });

      });

    });

    context('changing keys (detected by setter)', function() {

      context('no overlap', function() {

        context('value to branch', function() {

          xit('emits patch and updates file 5', function() {

          });

          xit('ignores file change (no inbound "sync echo") 5', function() {

          });

        });

        context('branch', function() {

          xit('emits patch and updates file 6', function() {

          });

          xit('ignores file change (no inbound "sync echo") 6', function() {

          });

        });

        context('branch to value', function() {

          xit('emits patch and updates file 7', function() {

          });

          xit('ignores file change (no inbound "sync echo") 7', function() {

          });

        });

      });

      context('with overlap', function() {

        context('value to branch', function() {

          xit('emits patch and updates file 8', function() {

          });

          xit('ignores file change (no inbound "sync echo") 8', function() {

          });

        });

        context('branch', function() {
          
          xit('emits patch and updates file 9', function() {

          });

          xit('ignores file change (no inbound "sync echo") 9', function() {

          });

        });

        context('branch to value', function() {
          
          xit('emits patch and updates file 10', function() {

          });

          xit('ignores file change (no inbound "sync echo") 10', function() {

          });

        });

      });

    });

    // it('writes to all sources when overlapped is removed');
    // it('can modify object to value');
    // it('add new keys (updates vtree) and emits patch (correct source, onMultiple last)');
    // it('add new keys (updates vtree) and emits patch (correct source, onMultiple first)');
    // it('removes keys (updates vtree) and emits patch (correct source, onMultiple last');
    // it('removes keys (updates vtree) and emits patch (correct source, onMultiple first');
    // it('removes keys (updates vtree) and emits patch (correct source, onMultiple fn');
    // it('add new keys (updates vtree) and emits patch (correct source, onMultiple fn)');

  });


});
