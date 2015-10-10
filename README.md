`npm install ntree --save`

[![Build Status](https://travis-ci.org/nomilous/ntree.svg)](https://travis-ci.org/nomilous/ntree)

# ntree

A file system based "living tree" of functional data.

## ?

TODO: It loads a `tree` of data recursed from `config.mount/**/*.js`.

TODO: It synchronizes changes: file system ---> `tree`

TODO: It synchronizes changes: file system <--- `tree`

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
