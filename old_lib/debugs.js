var debug = require('debug');
var util = require('util');

module.exports = function(context, functions) {
  var these = {}
  functions.forEach(function(name) {
    these[name] = debug(util.format('%s:%s', context, name));
  });
  return these;
}
