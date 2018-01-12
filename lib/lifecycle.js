'use strict';

const _      = require(`lodash`);
const events = [
  `beforeInit`,
  `afterInit`,
];

const Lifecycle = function (ms) {
  this.ms     = ms;
  this.events = {};

  _.forEach(events, event => {
    this.events[event] = [];
    this.ms[event]     = trigger => this.addEventTrigger(event, trigger);
  });
};

Lifecycle.prototype.addEventTrigger = function addEventTrigger (event, trigger) {
  if (events.indexOf(event) === -1) {
    return Promise.reject(`Unknown event "${event}"`);
  }

  const eventTriggers = this.events[event];

  eventTriggers.push(trigger);

  return Promise.resolve();
};
Lifecycle.prototype.trigger = function trigger (event) {
  if (events.indexOf(event) === -1) {
    return Promise.reject(`Unknown event "${event}"`);
  }
  const triggers = this.events[event] || [];

  return Promise.all(
    triggers.map(trigger => trigger())
  );
};

module.exports = Lifecycle;
