objective 'Tree', ->



    before (Tree, fs) -> 

        mock 'expect', require('chai').expect
        mock 'prototype', Tree.Tree.prototype

        mock(global).stub setInterval: -> # TODO: objective: fix strange warning

        fs.stub readdir: (path, callback) ->

            return callback null, [] if path == '/p/a/t/h'
            return callback null, [] if path == process.cwd()
            return mock.original.apply this, arguments


    context 'create()', ->


        it 'creates an instance mounted on cwd', (done, expect, Tree) ->

            Tree.create (e, tree) ->

                expect tree
                .to.be.an.instanceof Tree.Tree

                expect tree._meta.mount
                .to.equal process.cwd()

                expect tree._meta.shallow
                .to.equal process.cwd() + '/*.js'

                expect tree._meta.deep
                .to.equal process.cwd() + '/**/*.js'

                done()

            .catch done


        it 'creates an instance per config', (done, expect, Tree) ->

            Tree.create mount: '/p/a/t/h', (e, tree) ->

                expect tree._meta.mount
                .to.equal '/p/a/t/h'

                done()

            .catch done


        it 'supports promise without config', (done, expect, Tree) ->

            Tree.create()

            .then (tree) ->

                expect tree
                .to.be.an.instanceof Tree.Tree

            .then done

            .catch done


        it 'supports promise with config', (done, expect, Tree) ->

            Tree.create

                mount: '/p/a/t/h'

            .then (tree) ->

                expect tree
                .to.be.an.instanceof Tree.Tree

                expect tree._meta.mount
                .to.equal '/p/a/t/h'

            .then done

            .catch done


        it 'calls instance start', (done, prototype, Tree) ->

            prototype.does start: done

            Tree.create ->



    context 'start()', ->


        it 'recurses from the configured mount point', (done, expect, fs, Tree) ->

            fs.does readdir: (path, callback) ->

                expect(path).to.equal '/p/a/t/h'
                callback null, ['fakeresult'];

            fs.does lstat: (path, callback) ->

                expect(path).to.equal '/p/a/t/h/fakeresult'
                done()

            Tree.create mount: '/p/a/t/h'

            .then done

            .catch done


        it 'creates nodes with found files', (done, expect, fs, Tree, Node) ->

            trace.filter = true;

            fs.does readdir: (path, callback) ->

                expect(path).to.equal '/mount/point'
                callback null, ['directory']

            fs.does readdir: (path, callback) ->

                expect(path).to.equal '/mount/point'  # <---------------------- 2wice, inefficient
                callback null, ['directory']

            fs.does lstat: (path, callback) ->

                expect(path).to.equal '/mount/point/directory'
                callback null, isDirectory: -> true

            fs.does lstat: (path, callback) ->

                expect(path).to.equal '/mount/point/directory'
                callback null, isDirectory: -> true

            fs.does readdir: (path, callback) ->

                expect(path).to.equal '/mount/point/directory'
                callback null, ['thing.js']

            fs.does lstat: (path, callback) ->

                expect(path).to.equal '/mount/point/directory/thing.js'
                callback null, isDirectory: -> false


            Tree.create mount: '/mount/point'

            .then (tree) ->

                expect(tree._meta.files).to.eql 

                    '/mount/point/directory/thing.js': 1

                expect(tree._meta.nodes['directory/thing.js']).to.be.an.instanceof Node

            .then done

            .catch done


        it.only 'loads data from multiple js files', (done, expect, Tree) ->

            Tree.create mount: __dirname + '/../test_data/'

            .then (tree) ->

                console.log(tree.planets.inner)

                expect(tree).to.eql

                    sun:
                        name: 'Sun'
                        radius: 696000000
                    planets:
                        inner:
                            mercury:
                                name: 'Mercury'
                                radius: 2440000
                            venus:
                                name: 'Venus'
                                radius: 6052000
                            earth:
                                name: 'Earth'
                                radius: 6371000
                            mars:
                                name: 'Mars'
                                radius: 3390000
                        outer:
                            jupiter:
                                name: 'Jupiter'
                                radius: 69911000
                            saturn:
                                name: 'Saturn'
                                radius: 58232000
                            uranus:
                                name: 'Uranus'
                                radius: 25362000
                            neptune:
                                name: 'Neptune'
                                radius: 24622000


            .then done

            .catch done







