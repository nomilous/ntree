objective.only('SolarSystem', function(path) {

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


  it('loads the solars system ok', function(done, expect, ntree) {
    ntree.create(MOUNT).then(function(tree) {
      expect(JSON.parse(JSON.stringify(tree))).to.eql({
        "dwarf_planets": {
          "eris": {
            "name": "Eris",
            "radius": 1163000
          },
          "makemake": {
            "name": "Makemake",
            "radius": 739000
          },
          "pluto": {
            "name": "Pluto",
            "radius": 1186000
          }
        },
        "planets": {
          "inner": {
            "venus": {
              "name": "Venus",
              "radius": 6052000
            },
            "earth": {
              "name": "Earth",
              "radius": 6371000
            },
            "mars": {
              "name": "Mars",
              "radius": 3390000
            },
            "mercury": {
              "name": "Mercury",
              "radius": 2440000
            }
          },
          "outer": {
            "saturn": {
              "name": "Saturn",
              "radius": 58232000
            },
            "uranus": {
              "name": "Uranus",
              "radius": 25362000
            },
            "neptune": {
              "name": "Neptune",
              "radius": 24622000
            },
            "jupiter": {
              "name": "Jupiter",
              "radius": 69911000
            }
          }
        },
        "sun": {
          "name": "Sun",
          "radius": 696000000
        }
      });
      done();
    }).catch(done);
  });


  it('more...', function() {});

});
