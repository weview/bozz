'use strict';

const path     = require(`path`);
const extend   = require(`extend`);
const MS       = require(`./ms`);
const amqpOpts = require(`../config/amqp.default.js`);

module.exports = (options = {}) => {
  const cwd  = process.cwd();
  const opts = extend(true, {},{
    pkg  : require(path.resolve(cwd, `package.json`)),
    amqp : amqpOpts,
  }, options);

  return new MS(opts);

};
