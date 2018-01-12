'use strict';

module.exports = function use (plugin) {
  try {
    plugin.attach(this);
  } catch (e) {
    console.error(`Cannot attach plugin :\n`, e);
  }
};