`npm install ntree --save`



# ntree

A file system based "living tree" of functional data.

## ?

* Loads a tree of data recursed from `config.mount`/`**/*.js`
* Changes on the filesystem are synchronized into the tree.
* Change events are emitted.
* TODO: Changes in the tree are synchronized back to the file system.

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
