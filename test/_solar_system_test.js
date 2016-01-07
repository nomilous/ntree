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

  beforeEach('install solar system', function(done, cpr) {
    cpr(SOURCE, MOUNT, done);
  });

  afterEach('remove solar system', function(done, rimraf) {
    rimraf(MOUNT, done);
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


  context('syncIn', function() {

    context('new source files/dirs', function() {
      it('');
    });

    context('changed source files/dirs', function() {
      it('');
    });

    context('deleted source files/dirs', function() {

      it('remembers which source for removing keys added after start');

      it('emits diff');

      it('deletes from tree when source deleted (file, no path overlap, nested)',
        // deletes pluto.js (has no overlap with directory or other js files)
        function(done, expect, ntree, SolarSystem, fs, path) {
          ntree.create(MOUNT).then(function(tree) {

            var deletefile = path.normalize(MOUNT + '/dwarf_planets/pluto.js');
            var tref = tree.dwarf_planets.pluto; // these get deleted when file is deleted
            var vref = tree._vertices.dwarf_planets.pluto;

            delete SolarSystem.dwarf_planets.pluto; // delete from test reference
            
            tree.on('$unload', function() {
              try {
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
          ntree.create(MOUNT).then(function(tree) {

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

            tree.on('$unload', function() {
              tree._stop();
              try {
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
          ntree.create(MOUNT).then(function(tree) {

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

            tree.on('$unload', function() {
              tree._stop();
              try {
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

                // expect(tree._vertices.planets.inner.earth.__.sources.length).to.equal(1);
                // expect(tree._vertices.planets.inner.earth.__.sources[0].filePath).to.equal('planets.js');

                // expect(tree._vertices.planets.inner.earth.name.__.sources.length).to.equal(1);
                // expect(tree._vertices.planets.inner.earth.name.__.sources[0].filePath).to.equal('planets.js');
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
          ntree.create(MOUNT).then(function(tree) {

            var deletefile = path.normalize(MOUNT + '/dwarf_planets/makemake');

            // create expected (post deletion) solar system
            delete SolarSystem.dwarf_planets.makemake;

            tree.on('$unload', function(source) {
              if (source.filename !== deletefile) return;
              tree._stop();
              try {
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
          ntree.create(MOUNT).then(function(tree) {

            var deletefile = path.normalize(MOUNT + '/dwarf_planets');

            // create expected (post deletion) solar system
            delete SolarSystem.dwarf_planets;

            tree.on('$unload', function(source) {
              if (source.filename !== deletefile) return;
              tree._stop();
              try {
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
          ntree.create(MOUNT).then(function(tree) {

            var deletefile = path.normalize(MOUNT + '/planets/inner');

            // create expected (post deletion) solar system
            delete SolarSystem.planets.inner.mercury;

            tree.on('$unload', function(source) {
              if (source.filename !== deletefile) return;
              tree._stop();
              try {
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
          ntree.create(MOUNT).then(function(tree) {

            var deletefile = path.normalize(MOUNT + '/sun');

            // create expected (post deletion) solar system
            delete SolarSystem.sun.radius;

            tree.on('$unload', function(source) {
              if (source.filename !== deletefile) return;
              tree._stop();
              try {
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
