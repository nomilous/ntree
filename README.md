[![Build Status](https://travis-ci.org/nomilous/ntree.svg)](https://travis-ci.org/nomilous/ntree)

# ntree

A file system based "living tree" of functional data.

`npm install ntree --save`

## ?

It assembles a `tree` of data from fragments recursed out of the `config.mount` directory.

Each fragment is a node/javascript file with data per whatever it `module.exports`.

TODO: It synchronizes changes: file system ---> `tree`

TODO: It synchronizes changes: file system <--- `tree`

TODO: It follows symlinks

TODO: It supports functions.

TODO: It emits change events.

TODO: Maintain key order.

TODO: Standardize change op names (json patch?)

## eg.

```javascript
var ntree = require('ntree');

ntree.create({mount: '/path/to/data/root'})

.then(function(tree) {
  
  // and then use the tree

})

.catch(function(e) {});

```

## and then use the tree

```javascript

// pending

```


## and use the file system

```

// pending

```

## important

This is not a database.

Reads (and wites) from updated data fragment (.js) files are synchronous (per `require('filename')`) and will therefore not scale beyond a moderate concurrency.


## caveats

removing and adding same key goes undetected... (explain)


