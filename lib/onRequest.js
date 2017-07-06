'use strict';

const stringifySafe = require(`json-stringify-safe`);

const Rpc = function (ms) {
  this.ms        = ms;
  this.listeners = {};
};

Rpc.prototype.init = function () {
  const ms = this.ms;
  return ms.channel.assertQueue(ms.queue, { durable : false })
  .then(() => ms.channel.prefetch(1))
  .then(() => ms.channel.consume(ms.queue, msg => {
    this.handleListener(msg)
    .then(() => null)
    .catch(e => {
      console.error(`Got an error handling a listener :`, e);
    });
  }, { noAck : true }));
  // this.channel.assertQueue(this.queue, { durable : false });

  // this.channel.consume(this.queue, this.processMsg, { noAck : true });
};

Rpc.prototype.handleListener = function (msg) {
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

Rpc.prototype.findListener = function (action) {
  return this.listeners[action] || null;
};

Rpc.prototype.addListener = function (action, method) {
  this.listeners[action] = method;

  return this.ms.registry.register(action, method);

  // return Promise.resolve();
  // return this.registry.get(action)
  // .then(item => {
  //   const answer = new RpcAnswer();
  //   this.addAnswer(answer);
  //   channel.sendToQueue(queueName, new Buffer(stringifySafe(msg)), {
  //     correlationId : answer.id,
  //     replyTo       : rpcResponseQueue,
  //   });

  //   return answer.promise;
  // });

  // return answer.promise;
  // return queries.retrieve(queryName)
  // .then(method => method(params))
  // .catch(e => {
  //   console.error(e);
  // });
};

module.exports = Rpc;

// Let the tasks survive even if RabbitMQ is restarted.
// this.channel.assertQueue(this.queue, { durable : false });

// Fair dispatch
// this.channel.prefetch(1);

// Consume queue messages with acknowledgments
// this.channel.consume(this.queue, this.processMsg, { noAck : true });

// const registry = require(`./registry`);

// module.exports = (pattern, params) => {
//   return registry.register(queryName, params)
//   .then(() => ({}));
// };
