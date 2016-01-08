module.exports = DuplicateKeyError;

function DuplicateKeyError(message, sources) {
  this.constructor.prototype.__proto__ = Error.prototype;
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message;
  Object.defineProperty(this, 'sources', {
    enumerable: true,
    get: function() {
      return sources
    }
  });
}
