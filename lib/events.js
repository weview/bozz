'use strict';

const stringifySafe = require(`json-stringify-safe`);
const topicPattern  = require(`topic-patterns`);

const Events = function (ms) {
  this.ms        = ms;
  this.listeners = [];
};

Events.prototype.init = function () {
  const ms = this.ms;
  return ms.channel.assertExchange(ms.exEvents, 'topic', { durable : false })
  .then(() => ms.channel.assertQueue(ms.queueEvents, { durable : false }))
  .then(() => ms.channel.consume(ms.queueEvents, msg => {
    this.handleEvent(msg)
  }, { noAck : true }))
  .then(() => this.addWaitingListeners());
};

Events.prototype.emit = function (key, msg) {
  const ms = this.ms;

  if (!ms.isInit) {
    return Promise.reject(new Error(`Bozz MS is not initialized`));
  }

  try {
    ms.channel.publish(ms.exEvents, key, new Buffer(stringifySafe(msg)));
  } catch (e) {
    return Promise.reject(e);
  }

  return Promise.resolve();
};

Events.prototype.addWaitingListeners = function () {
  const ms = this.ms;
  return Promise.all(
    this.listeners.map(({ key }) =>
      ms.channel.bindQueue(ms.queueEvents, ms.exEvents, key)
    )
  );
};

Events.prototype.watch = function (key, method) {
  const ms      = this.ms;
  const pattern = new topicPattern(key);
  this.listeners.push({ key, method, pattern });
  if (!ms.isInit) { return Promise.resolve(); }

  try {
    ms.channel.bindQueue(ms.queueEvents, ms.exEvents, key);
  } catch (e) {
    return Promise.reject(e);
  }

  return Promise.resolve();
};

Events.prototype.handleEvent = function (msg) {
  try {
    msg.content = JSON.parse(msg.content);
  } catch (e) {
    return Promise.reject(e);
  }
  const key   = msg.fields.routingKey;
  msg.content = msg.content || {};

  this.listeners.forEach(listener => {
    if (listener.pattern.match(key)) {
      this.callEventListener(listener, key, msg);
    }
  });
};

Events.prototype.callEventListener = function (listener, key, msg) {
  let promise = null;

  try {
    const params = [key];
    if (msg.content) {
      params.push(msg.content);
    }
    promise = Reflect.apply(listener.method, listener.method, params);
  } catch (e) {
    promise = Promise.reject(e);
  }

  if (!(promise instanceof Promise)) {
    promise = Promise.resolve(promise);
  }

  promise
  .catch(e => console.error(`Got an error running an event listener :`, e));
};

module.exports = Events;
