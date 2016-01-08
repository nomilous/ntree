[![Build Status](https://travis-ci.org/nomilous/ntree.svg)](https://travis-ci.org/nomilous/ntree)

# ntree

`npm install ntree --save`

A file system based "living tree" of functional data.

## a what?

It assembles a `tree` of data from fragments recursed out of the `config.mount` directory.

Each fragment is a node/javascript file with data per whatever it `module.exports`.

### Play with cli and sample data

**first console:** start cli (repl) with data directory to mount

```javascript
bin/ntree sample/solar_system
>
> // subscribe to $patch events
> $tree.on('$patch', change => console.log(change));
>
```

**second console:** create a new directory on disk

```bash
mkdir sample/solar_system/planets/outer/jupiter/moons
```

**back in first console** see `$patch` event as disk change syncs into the tree

```javascript
>
> { 
  doc: { 
    path: '/planets/outer/jupiter/moons' 
  },
  /* application/json-patch+json */
  patch: [
    { 
      op: 'add',
      path: '',
      value: {} 
    } 
  ] 
}
```


TODO: add .json

TODO: It synchronizes changes: file system ---> `tree`

TODO: It synchronizes changes: file system <--- `tree`

TODO: It supports functions.

TODO: It emits change events.

TODO: Configure patch emit to supply doc path, doc type

TODO: Configure patch emit to use full path in patch ops

TODO: Standardize change op names (json patch?)

TODO: What happens on orphaned branch when still got ref but deleted nearer root (in tree, on disk)

TODO: Delete renames to .YYMMDD.HHMMSS.mmm.deleted

TODO: functions are bound to containing doc as this

TODO: functions use in.

TODO: array support

TODO: lazy loading

TODO: should all directory event emit noop patch operation

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
