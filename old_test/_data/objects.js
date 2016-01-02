module.exports = {
  'S': {
    'boolean': 4,
    'number': 5,
    'string': 'one',
    'object': {
      'A': 1,
    },
    'fn': function () {
      return 'S';
    },
  },
  'A': {
    'boolean': true,
    'number': 4,
    'string': 'two',
    'object': {
      'R': 2,
    },
    'fn': function () {
      return 'A';
    },
  },
};