'use strict';

const stringifySafe = require(`json-stringify-safe`);
const RpcAnswer     = require(`./rpcAnswer`);

const Rpc = function (ms) {
  this.ms      = ms;
  this.answers = {};
};

Rpc.prototype.init = function () {
  const ms = this.ms;
  return ms.channel.assertQueue(ms.queueRpc, { durable : false, exclusive : true })
  .then(() => ms.channel.prefetch(1))
  .then(() => ms.channel.consume(ms.queueRpc, msg => {
    this.handleRpcAnswer(msg)
    .then(() => null)
    .catch(e => {
      console.error(`Got an error handling a rpc answer :`, e);
    });
  }, { noAck : true }));
  // this.channel.assertQueue(this.queue, { durable : false });

  // this.channel.consume(this.queue, this.processMsg, { noAck : true });
};

Rpc.prototype.handleRpcAnswer = function (msg) {
  msg.properties = msg.properties || {};
  if (!msg.properties.correlationId) { return Promise.reject(`Missing correlation id`); }
  const answer = this.findAnswer(msg.properties.correlationId);
  if (!answer) { return Promise.reject(`No awaiting request for this answer`); }

  return answer.handler(msg);
};

Rpc.prototype.findAnswer = function (answerId) {
  return this.answers[answerId] || null;
};

Rpc.prototype.addAnswer = function (answer) {
  this.answers[answer.id] = answer;
};

Rpc.prototype.run = function (action, params) {
  return this.ms.registry.get(action)
  .then(item => {
    const answer = new RpcAnswer();
    this.addAnswer(answer);
    this.ms.channel.sendToQueue(item.queue, new Buffer(stringifySafe({ action, params })), {
      correlationId : answer.id,
      replyTo       : this.ms.queueRpc,
    });

    return answer.promise;
  });

  // return answer.promise;
  // return queries.retrieve(queryName)
  // .then(method => method(params))
  // .catch(e => {
  //   console.error(e);
  // });
};

module.exports = Rpc;
