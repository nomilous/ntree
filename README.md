`npm install ntree --save`

[![Build Status](https://travis-ci.org/nomilous/ntree.svg)](https://travis-ci.org/nomilous/ntree)

# ntree

A file system based "living tree" of functional data.

## ?

It loads a tree of data recursed from `config.mount`/`**/*.js`.
It synchronizes changes on the file system into the tree.
It emits change events.
TODO: It synchronizes changes on the tree into the file system. 

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
