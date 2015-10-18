Object.defineProperty(Array.prototype, 'last', {
  configurable: true,
  get: function() {
    return this[this.length - 1];
  }
});
