'use strict';

const amqp       = require(`amqplib`);
const uuid       = require(`uuid`);
const Registry   = require(`./registry`);
const On         = require(`./on`);
const Rpc        = require(`./rpc`);

const MS = function MS(options = {}) {
  this.options  = options;
  this.service  = options.pkg.name;
  this.queue    = `bozz-${this.service}`;
  this.queueRpc = `bozz-rpc-${this.service}-${uuid.v4()}`;
  this.amqp     = null;
  this.channel  = null;
  this.registry = new Registry(this);
  this.rpcMod   = new Rpc(this);
  this.onMod    = new On(this);
};

MS.prototype.connect = function () {
  return amqp.connect(`amqp://${this.options.amqp.host}`);
};

MS.prototype.init = function () {
  return this.connect()
  .then(conn => this.amqp = conn)
  .then(() => this.amqp.createChannel())
  .then(ch => this.channel = ch)
  .then(() => Promise.all([
    this.rpcMod.init(),
    this.onMod.init(),
  ]));
};

MS.prototype.rpc = function (...args) {
  return Reflect.apply(this.rpcMod.run, this.rpcMod, args);
};

MS.prototype.on = function (...args) {
  return Reflect.apply(this.onMod.addListener, this.onMod, args);
};

module.exports = MS;
