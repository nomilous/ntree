module.exports = Node;

function Node(tree, info) {

  this.path = info.fullname.replace(tree._meta.regex, '');

}
