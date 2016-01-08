objective
    
    title: 'ntree'
    uuid: 'b7c1eeaf-cdc3-4ed8-a883-7de3f1803722'
    description: 'a file system based "living tree" of functional data'
    repl: listen: '/tmp/socket-b7c1eeaf-cdc3-4ed8-a883-7de3f1803722'
    once: false
    plugins: 
        'objective_dev':
            # reporter: 'Dot'
            sourceDir: 'lib'
            testDir: 'test'
            testAppend: '_test'
            timeout: 1000
            runAll: true
            showTrace: true
            filterTrace: true

.run ->

