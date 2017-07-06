'use strict';

const amqp       = require(`amqplib`);
const uuid       = require(`uuid`);
const Registry   = require(`./registry`);
const OnRequest  = require(`./onRequest`);
const Request    = require(`./request`);

const MS = function MS(config = {}) {
  this.config   = config;
  this.service  = config.pkg.name;
  this.queue    = `bozz-${this.service}`;
  this.queueRpc = `bozz-rpc-${this.service}-${uuid.v4()}`;
  this.amqp     = null;
  this.channel  = null;
  this.registry = new Registry(this);
  this.reqMod   = new Request(this);
  this.onReqMod = new OnRequest(this);
};

MS.prototype.connect = function () {
  return amqp.connect(`amqp://${this.config.amqp.host}`);
};

MS.prototype.init = function () {
  return this.connect()
  .then(conn => this.amqp = conn)
  .then(() => this.amqp.createChannel())
  .then(ch => this.channel = ch)
  .then(() => Promise.all([
    this.reqMod.init(),
    this.onReqMod.init(),
  ]))
  .then(() => console.log(`[bozz] Service ${this.service} initialized`));
};

MS.prototype.request = function (...args) {
  return Reflect.apply(this.reqMod.run, this.reqMod, args);
};

MS.prototype.onRequest = function (...args) {
  return Reflect.apply(this.onReqMod.addListener, this.onReqMod, args);
};

module.exports = MS;
