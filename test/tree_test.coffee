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

            Tree.create (e, instance) ->

                expect instance
                .to.be.an.instanceof Tree.Tree

                expect instance._meta.mount
                .to.equal process.cwd()

                expect instance._meta.shallow
                .to.equal process.cwd() + '/*.js'

                expect instance._meta.deep
                .to.equal process.cwd() + '/**/*.js'

                done()

            .catch done


        it 'creates an instance per config', (done, expect, Tree) ->

            Tree.create mount: '/p/a/t/h', (e, instance) ->

                expect instance._meta.mount
                .to.equal '/p/a/t/h'

                done()

            .catch done


        it 'supports promise without config', (done, expect, Tree) ->

            Tree.create()

            .then (instance) ->

                expect instance
                .to.be.an.instanceof Tree.Tree

            .then done

            .catch done


        it 'supports promise with config', (done, expect, Tree) ->

            Tree.create

                mount: '/p/a/t/h'

            .then (instance) ->

                expect instance
                .to.be.an.instanceof Tree.Tree

                expect instance._meta.mount
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

                expect(tree._meta.nodes['/directory/thing.js']).to.be.an.instanceof Node

            .then done

            .catch done



