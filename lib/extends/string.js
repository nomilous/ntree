Object.defineProperty(String.prototype, 'last', {
  configurable: true,
  enumerable: false,
  get: function() {
    return this[this.length - 1];
  }
});
