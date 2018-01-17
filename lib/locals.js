'use strict';

const Locals = function (ms) {
  this.locals = {};
};

Locals.prototype.get = async function (local) {
  return this.locals[local] || null;
};

Locals.prototype.set = async function (local, value) {
  this.locals[local] = value;

  return value;
};

module.exports = Locals;
