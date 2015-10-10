`npm install ntree --save`

[![Build Status](https://travis-ci.org/nomilous/ntree.svg)](https://travis-ci.org/nomilous/ntree)

# ntree

A file system based "living tree" of functional data.

## ?

TODO: It assembles a `tree` of data from fragments (leaves, branches) recursed out of the `config.mount` directory.

TODO: Each fragment is a node/javascript file with data per whatever it `module.exports`.

TODO: It synchronizes changes: file system ---> `tree`

TODO: It synchronizes changes: file system <--- `tree`

TODO: It supports functions.

TODO: It emits change events.

## eg.

```javascript
var ntree = require('ntree');

ntree.create({mount: '/path/to/data/root'})

.then(function(tree) {
  
  // use the tree

})

.catch(function(e) {});

```

## use the tree

```javascript

// pending

tree.on('modified');

tree.on('unmodified');

```
