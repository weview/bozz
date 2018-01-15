'use strict';

const Locals = function (ms) {
  this.locals = {};
};

Locals.prototype.get = function (local) {
  return this.locals[local] || null;
};

Locals.prototype.set = function (local, value) {
  this.locals[local] = value;

  return value;
};

module.exports = Locals;
