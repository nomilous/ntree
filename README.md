# ntree

A file system based "living tree" of functional data.

`npm install ntree --save`

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

.catch(function(e) {

  console.error(e.stack);
  process.exit(e.errno || 1);

})

```

## use the tree

```javascript

// pending

tree.on('modified');

tree.on('unmodified');

```
