module.exports = MultipleSourceError;

function MultipleSourceError(keys, sources) {
  this.constructor.prototype.__proto__ = Error.prototype;
  Error.captureStackTrace(this, this.constructor);

  this.name = this.constructor.name;
  this.message = keys.join('.');

  Object.defineProperty(this, 'info', {
    enumerable: true,
    get: function() {
      return {
        keys: keys,
        sources: sources
      }
    }
  });
}
