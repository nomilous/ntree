module.exports = MultipleSourceError;

function MultipleSourceError(route, sources) {
  this.constructor.prototype.__proto__ = Error.prototype;
  Error.captureStackTrace(this, this.constructor);

  this.name = this.constructor.name;
  this.message = route.join('/');

  Object.defineProperty(this, 'info', {
    enumerable: true,
    get: function() {
      return {
        route: route,
        original: sources[1],
        duplicate: sources[0],
      }
    }
  });
}
