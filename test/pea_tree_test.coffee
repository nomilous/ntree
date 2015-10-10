objective 'PeaTree', ->

    before -> mock 'expect', require('chai').expect

    context 'create()', ->

        it 'creates an instance mounted on cwd', (done, expect, PeaTree) ->

            PeaTree.create (e, instance) ->

                expect instance
                .to.be.an.instanceof PeaTree.PeaTree

                expect instance.root
                .to.equal process.cwd()

                instance.root = 'changed'

                expect instance.root
                .to.equal process.cwd()

                done()

            .catch done


        it 'creates an instance per config', (done, expect, PeaTree) ->

            PeaTree.create root: '/p/a/t/h', (e, instance) ->

                expect instance.root
                .to.equal '/p/a/t/h'

                done()

            .catch done


        it 'supports promise without config', (done, expect, PeaTree) ->

            PeaTree.create()

            .then (instance) ->

                expect instance
                .to.be.an.instanceof PeaTree.PeaTree

                expect instance.root
                .to.equal process.cwd()

            .then done

            .catch done


        it 'supports promise with config', (done, expect, PeaTree) ->

            PeaTree.create

                root: '/p/a/t/h'

            .then (instance) ->

                expect instance
                .to.be.an.instanceof PeaTree.PeaTree

                expect instance.root
                .to.equal '/p/a/t/h'

            .then done

            .catch done

