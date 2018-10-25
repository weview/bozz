'use strict';

const stringifySafe = require(`json-stringify-safe`);
const RpcAnswer     = require(`./rpcAnswer`);

const Requests = function (ms) {
  this.ms        = ms;
  this.answers   = {};
  this.listeners = {};
};

Requests.prototype.initRpc = function () {
  const ms = this.ms;
  return ms.channel.assertQueue(ms.queueRpc, { durable : false, exclusive : true })
  .then(() => ms.channel.consume(ms.queueRpc, msg => {
    this.handleRpcAnswer(msg)
    .then(() => null)
    .catch(e => {
      console.error(`Got an error handling a rpc answer :`, e);
    });
  }, { noAck : true }));
};

Requests.prototype.initListener = function () {
  const ms = this.ms;
  return ms.channel.assertQueue(ms.queueOnReq, { durable : false })
  .then(() => ms.channel.consume(ms.queueOnReq, msg => {
    this.handleListener(msg)
    .then(() => null)
    .catch(e => {
      console.error(`Got an error handling a listener :`, e);
    });
  }, { noAck : true }));
};

Requests.prototype.init = function () {
  return Promise.all([
    this.initRpc(),
    this.initListener(),
  ]);
};

Requests.prototype.handleRpcAnswer = function (msg) {
  msg.properties = msg.properties || {};
  if (!msg.properties.correlationId) { return Promise.reject(`Missing correlation id`); }
  const answer = this.findAnswer(msg.properties.correlationId);
  if (!answer) { return Promise.reject(`No awaiting request for this answer`); }

  return answer.handler(msg);
};

Requests.prototype.findAnswer = function (answerId) {
  return this.answers[answerId] || null;
};

Requests.prototype.addAnswer = function (answer) {
  this.answers[answer.id] = answer;
};

Requests.prototype.performRequest = function (action, params) {
  if (!this.ms.isInit) {
    return Promise.reject(new Error(`Bozz MS is not initialized`));
  }

  return this.ms.registry.getAction(action)
  .then(item => {
    const answer = new RpcAnswer();
    this.addAnswer(answer);
    if (!item) {
      return answer.reject(new Error(`No target found for action ${action}`));
    }
    this.ms.channel.sendToQueue(item.queue, new Buffer(stringifySafe({ action, params })), {
      correlationId : answer.id,
      replyTo       : this.ms.queueRpc,
    });

    return answer.promise;
  });
};

Requests.prototype.handleListener = function (msg) {
  try {
    msg.content = JSON.parse(msg.content);
  } catch (e) {
    return Promise.reject(e);
  }
  msg.content    = msg.content || {};
  msg.properties = msg.properties || {};
  const action   = msg.content.action;
  const params   = msg.content.params || {};
  const listener = this.findListener(action);
  if (!listener) { return Promise.reject(`No listener found for this request`); }

  let promise = null;
  try {
    promise = Reflect.apply(listener, listener, [params]);
  } catch (e) {
    promise = Promise.reject(e);
  }

  if (!(promise instanceof Promise)) {
    promise = Promise.resolve(promise);
  }

  return promise
  .then(res =>
    msg.properties.replyTo && this.ms.channel.sendToQueue(msg.properties.replyTo, new Buffer(stringifySafe({ err : null, res })), {
      correlationId : msg.properties.correlationId,
    })
  )
  .catch(err => {
    if (msg.properties.replyTo) {
      this.ms.channel.sendToQueue(msg.properties.replyTo, new Buffer(stringifySafe({ err, res : null })), {
        correlationId : msg.properties.correlationId,
      });
    }

    return Promise.reject(err);
  });
};

Requests.prototype.findListener = function (action) {
  return this.listeners[action] || null;
};

Requests.prototype.addListener = function (action, method) {
  this.listeners[action] = method;

  return this.ms.registry.registerAction(action, method);
};

module.exports = Requests;
