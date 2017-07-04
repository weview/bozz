'use strict';

const uuid          = require(`uuid`);
const stringifySafe = require(`json-stringify-safe`);

const RpcAnswer = function () {
  this.resolve = null;
  this.reject  = null;
  this.id      = uuid.v4();
  this.promise = new Promise((resolve, reject) => {
    this.resolve = resolve;
    this.reject  = reject;
  });
};

RpcAnswer.prototype.handler = function (msg) {
  const content = JSON.parse(msg.content);
  const res     = content.res;
  let response  = res;
  if (content.err) {
    console.log(`[queue] error - Rpc returned : ${JSON.stringify(content.err)}`);

    this.reject(content.err);

    return Promise.reject(content.err);
  }
  if (res && typeof res.type === `string`) {
    response = Buffer.from(res.data, res.encoding).toString();
  }

  console.log(`[queue] info - Rpc got an answer without error`);

  this.resolve(response);

  return Promise.resolve(response);
};

module.exports = RpcAnswer;
