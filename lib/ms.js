'use strict';

const _         = require(`lodash`);
const amqp      = require(`amqplib`);
const uuid      = require(`uuid`);
const Locals    = require(`./locals`);
const Registry  = require(`./registry`);
const Requests  = require(`./requests`);
const Events    = require(`./events`);
const Lifecycle = require(`./lifecycle`);
const use       = require(`./use`);

function gotError (e) {
  console.log(e);
  return Promise.reject(e);
}

const MS = function MS(config = {}) {
  this.config      = config;
  this.service     = config.pkg.name;
  this.namespace   = config.namespace;
  this.queueOnReq  = `bozz@${this.namespace}@${this.service}`;
  this.queueRpc    = `bozz@${this.namespace}@rpc-${this.service}-${uuid.v4()}`;
  this.queueEvents = `bozz@${this.namespace}@events-${this.service}`;
  this.exEvents    = `bozz@${this.namespace}@events`;
  this.amqp        = null;
  this.channel     = null;
  this.isInit      = false;
  this.locals      = new Locals(this);
  this.registry    = new Registry(this);
  this.requestsMod = new Requests(this);
  this.eventsMod   = new Events(this);
  this.lifecycle   = new Lifecycle(this);
};

MS.prototype.connect = function () {
  return amqp.connect(`amqp://${this.config.amqp.host}`);
};

MS.prototype.init = function () {
  return this.lifecycle.trigger(`beforeInit`)
  .then(() => this.connect())
  .then(conn => this.amqp = conn)
  .then(() => this.amqp.createChannel())
  .then(ch => this.channel = ch)
  .then(() => this.channel.prefetch(1))
  .then(() => Promise.all([
    this.requestsMod.init(),
    this.eventsMod.init(),
  ]))
  .then(() => this.isInit = true)
  .then(() => this.lifecycle.trigger(`afterInit`))
  .then(() => console.log(`[bozz] Service ${this.service} initialized`));
};

MS.prototype.request = function (...args) {
  return Reflect.apply(this.requestsMod.performRequest, this.requestsMod, args)
  .catch(gotError);
};

MS.prototype.onRequest = function (...args) {
  return Reflect.apply(this.requestsMod.addListener, this.requestsMod, args)
  .catch(gotError);
};

MS.prototype.onRequests = function (requestsObj) {
  return Promise.all(
    _.map(requestsObj, (method, event) => this.onRequest(event, method))
  )
  .catch(gotError);
};

MS.prototype.broadcast = function (...args) {
  return Reflect.apply(this.eventsMod.emit, this.eventsMod, args)
  .catch(gotError);
};

MS.prototype.onEvent = function (...args) {
  return Reflect.apply(this.eventsMod.watch, this.eventsMod, args)
  .catch(gotError);
};

MS.prototype.onEvents = function (eventsObj) {
  return Promise.all(
    _.map(eventsObj, (method, event) => this.onEvent(event, method))
  )
  .catch(gotError);
};

MS.prototype.set = function (...args) {
  return Reflect.apply(this.locals.set, this.locals, args);
};

MS.prototype.get = function (...args) {
  return Reflect.apply(this.locals.get, this.locals, args);
};

MS.prototype.use = use;

module.exports = MS;
