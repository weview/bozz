'use strict';

const redis = require(`promise-redis`)();

const Registry = function (ms) {
  this.ms              = ms;
  this.dbNumber        = 1;
  this.redisClient     = null;
  this.keyPrefix       = `bozz@${this.ms.namespace}@registry`;
  this.actionKeyPrefix = `${this.keyPrefix}-action`;
  this.eventKeyPrefix  = `${this.keyPrefix}-event`;
  this.actionsKey      = `${this.keyPrefix}-msActions`;
  this.eventsKey       = `${this.keyPrefix}-msEvents`;

  this.connect();
};

Registry.prototype.saveAction = function (actionKey) {
  return this.connect()
  .then(client => client.sadd(this.actionsKey, actionKey))
  .then(() => actionKey);
};

Registry.prototype.saveEvent = function (ev) {
  return this.connect()
  .then(client => client.sadd(this.eventsKey, ev))
  .then(() => ev);
};

Registry.prototype.purgeEvents = function () {
  return this.redisClient.smembers(this.eventsKey)
  .then(keys => Promise.all(
    keys.map(key => Promise.all([
      this.ms.eventsMod.unwatch(key),
      this.redisClient.del(key),
    ]))
  ))
  .then(() => this.redisClient.del(this.eventsKey));
};

Registry.prototype.purgeActions = function () {
  return this.redisClient.smembers(this.actionsKey)
  .then(keys => Promise.all(keys.map(key =>
    this.redisClient.del(key)
  )))
  .then(() => this.redisClient.del(this.actionsKey));
};

Registry.prototype.purge = function () {
  return Promise.all([
    this.purgeActions(),
    this.purgeEvents(),
  ]);
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

Registry.prototype.registerAction = function (action, method) {
  const actionKey = `${this.actionKeyPrefix}-${action}`;

  return this.connect()
  .then(client => Promise.all([
    client.hmset(actionKey, {
      service : this.ms.service,
      queue   : this.ms.queueOnReq,
    }),
    this.saveAction(actionKey),
  ]));
};

Registry.prototype.registerEvent = function (ev) {
  // const eventKey = `${this.eventKeyPrefix}-${ev}`;

  return this.connect()
  .then(client => Promise.all([
    // client.hmset(actionKey, {
    //   service : this.ms.service,
    //   queue   : this.ms.queueEvents,
    //   event   : ev,
    // }),
    this.saveEvent(ev),
  ]));
};

Registry.prototype.getAction = function (action) {
  return this.connect()
  .then(client =>
    client.hgetall(`${this.actionKeyPrefix}-${action}`)
  );
};

module.exports = Registry;
