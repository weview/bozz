'use strict';

const redis = require(`promise-redis`)();

const Registry = function (ms) {
  this.ms          = ms;
  this.dbNumber    = 1;
  this.redisClient = null;
  this.keyPrefix   = `bozz@${this.ms.namespace}@registry`;
  this.actionsKey  = `${this.keyPrefix}-msActions`;
  this.locals      = {};

  this.connect();
};

Registry.prototype.purge = function () {
  return this.redisClient.smembers(this.actionsKey)
  .then(keys => Promise.all(keys.map(key =>
    this.redisClient.del(key)
  )))
  .then(() => this.redisClient.del(this.actionsKey));
};

Registry.prototype.connect = function () {
  if (this.redisClient !== null) { return Promise.resolve(this.redisClient); }

  return new Promise((resolve, reject) => {
    const host = this.ms.config.redis.host;
    const port = this.ms.config.redis.port;
    this.redisClient = redis.createClient({ host, port });

    return this.redisClient.select(this.dbNumber, err => {
      if (err) { return reject(err); }

      return this.purge()
      .then(() => this.redisClient);
    });
  });
};

Registry.prototype.register = function (action, method) {
  this.locals[action] = method;
  const actionKey = `${this.keyPrefix}-${action}`;

  return this.connect()
  .then(client => Promise.all([
    client.hmset(actionKey, {
      service : this.ms.service,
      queue   : this.ms.queueOnReq,
    }),
    client.sadd(this.actionsKey, actionKey),
  ]));
};

Registry.prototype.get = function (action) {
  return this.connect()
  .then(client =>
    client.hgetall(`${this.keyPrefix}-${action}`)
  );
};

module.exports = Registry;
