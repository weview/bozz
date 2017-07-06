'use strict';

const Events = function (ms) {
  this.ms = ms;
};

Events.prototype.init = function () {
  return Promise.resolve();
};

// Registry.prototype.watch = function () {
//   if (this.redisClient !== null) { return Promise.resolve(this.redisClient); }

//   return new Promise((resolve, reject) => {
//     const host = this.ms.config.redis.host;
//     const port = this.ms.config.redis.port;
//     this.redisClient = redis.createClient({ host, port });

//     return this.redisClient.select(this.dbNumber, err => {
//       if (err) { return reject(err); }

//       return resolve(this.redisClient);
//     });
//   });
// };

// Registry.prototype.register = function (action, method) {
//   this.locals[action] = method;

//   return this.connect()
//   .then(client =>
//     client.hmset(`bozz-registry-${action}`, {
//       service : this.ms.service,
//       queue   : this.ms.queue,
//     })
//   );
// };

// Registry.prototype.get = function (action) {
//   return this.connect()
//   .then(client =>
//     client.hgetall(`bozz-registry-${action}`)
//   );
// };

module.exports = Events;
