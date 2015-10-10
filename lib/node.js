module.exports = Node;

function Node(tree, info) {

  this.path = info.fullname.replace(tree._meta.regex, '');

  console.log(this.path);

}
