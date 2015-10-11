module.exports = Node;

function Node(tree, info) {

  Object.defineProperty(this, 'info', {
    value: info
  });

  Object.defineProperty(this, 'root', {
    value: tree
  });

  Object.defineProperty(this, 'ref', {
    value: this.walk(this.root, null, this.info.keys.slice())
  });

}

Node.prototype.walk = function(treePtr, parent, keys) {

  var nextKey = keys.shift();

  if (!nextKey) {

    // TODO: require cache will prevent reload
    
    var data = require(this.info.fullname);

    if (typeof data == 'object') {

      if (Array.isArray(data)) {

        parent[keys.last] = data;

      }

      else {

        Object.keys(data).forEach(function(key) {

          treePtr[key] = data[key];

        });

      }

    }

    else {

      parent[keys.last] = data;

    }

    return [parent, keys.last];
  }

  // TODO: active property on secondlast key

  keys.last = nextKey;

  treePtr[nextKey] = treePtr[nextKey] || {};

  return this.walk(treePtr[nextKey], treePtr, keys);

}
