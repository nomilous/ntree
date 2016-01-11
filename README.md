[![Build Status](https://travis-ci.org/nomilous/ntree.svg)](https://travis-ci.org/nomilous/ntree)

# ntree

`npm install ntree --save`

A file system based "living tree" of functional data.

***

It assembles a `tree` of data from file sources recursed out of the `config.mount` directory. Each source is a node/javascript file with data per whatever it `module.exports`.

### try cli with sample data

**first console:** start cli (repl) with data directory to mount

```javascript
bin/ntree sample/solar_system
>
> // view the tree
> $tree  
Tree {
  dwarf_planets: [Getter/Setter],
  planets: [Getter/Setter],
  sun: [Getter/Setter] }
>
>
> // subscribe to $patch events
> $tree.on('$patch', change => console.log(JSON.stringify(change, null, 2)));
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
  "doc": {
    "path": "/planets/outer/jupiter/moons"
  },
  "patch": [
    {
      "op": "add",
      "path": "",
      "value": {}
    }
  ]
}
>
>
> // create new key
> $tree.planets.inner.earth.population = 7300000000;
7300000000
>
>
```

**back in first console** see `$patch` event from new key

```javascript
>
> {
  "doc": {
    "path": "/planets/inner"
  },
  "patch": [
    {
      "op": "add",
      "path": "/earth/population",
      "value": 7300000000
    }
  ]
}
```
Note: `earth.population` was written into `planets/inner.js` because that is where `earth` was last defined. (earth is also defined in `planets.js`, see `opts.source.select` to control where new keys on nodes with multiple sources are synced to)

***

TODO: add .json

TODO: prepend control vars on tree $$ instead of _

TODO: It synchronizes changes: file system ---> `tree`

TODO: It synchronizes changes: `tree` ---> file system

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

TODO: opts.source.select = function(vertex) {}

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
