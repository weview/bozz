'use strict';

const amqp     = require(`amqplib`);
const uuid     = require(`uuid`);
const Registry = require(`./registry`);
const Requests = require(`./requests`);
const Events   = require(`./events`);

const MS = function MS(config = {}) {
  this.config      = config;
  this.service     = config.pkg.name;
  this.queueOnReq  = `bozz-${this.service}`;
  this.queueRpc    = `bozz-rpc-${this.service}-${uuid.v4()}`;
  this.queueEvents = `bozz-events-${this.service}`;
  this.exEvents    = `bozz-events`;
  this.amqp        = null;
  this.channel     = null;
  this.registry    = new Registry(this);
  this.requestsMod = new Requests(this);
  this.eventsMod   = new Events(this);
};

MS.prototype.connect = function () {
  return amqp.connect(`amqp://${this.config.amqp.host}`);
};

MS.prototype.init = function () {
  return this.connect()
  .then(conn => this.amqp = conn)
  .then(() => this.amqp.createChannel())
  .then(ch => this.channel = ch)
  .then(() => this.channel.prefetch(1))
  .then(() => Promise.all([
    this.requestsMod.init(),
    this.eventsMod.init(),
  ]))
  .then(() => console.log(`[bozz] Service ${this.service} initialized`));
};

MS.prototype.request = function (...args) {
  return Reflect.apply(this.requestsMod.performRequest, this.requestsMod, args);
};

MS.prototype.onRequest = function (...args) {
  return Reflect.apply(this.requestsMod.addListener, this.requestsMod, args);
};

MS.prototype.broadcast = function (...args) {
  return Reflect.apply(this.eventsMod.emit, this.eventsMod, args);
};

MS.prototype.onEvent = function (...args) {
  return Reflect.apply(this.eventsMod.watch, this.eventsMod, args);
};

module.exports = MS;
