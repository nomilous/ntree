module.exports = FileAgent;

var fs = require('fs');

function FileAgent(filename, opts) {
  console.log('FILE', filename, opts);
  this.filename = filename;
  opts = opts || {};
  opts.interval = typeof opts.interval == 'number' ? opts.interval : 20;

}

