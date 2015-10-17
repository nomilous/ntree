```bash
$ bin/ntree sample/solar_system  # --debug

WARN: 'sample/solar_system/planets/inner.js' file ignored (path duplicate)
WARN: 'sample/solar_system/planets/inner' directory ignored (path duplicate)
WARN: 'sample/solar_system/planets/outer' directory ignored (path duplicate)
> 
> 
> $ntree
{ planets: [Getter/Setter],
  sun: [Getter/Setter],
  dwarf_planets: [Getter/Setter] }
> 
> 

```

Some files/directories in this are ignored by the ntree loader because they contain duplicate paths that are not (yet) supported.

eg. Multiple definitions for the vertices called 'inner' and 'earth'

__planets.js__
```javascript
module.exports = {
  inner: {
    earth: {
      name: 'Earth'
    }
  }
} 
```

__planets/inner/earth.js__
```javascript
module.exports.radius = 6371000;
```
