'use strict';

const path         = require(`path`);
const uuid         = require(`uuid`);
const extend       = require(`extend`);
const simplyconfig = require(`simplyconfig`);
const MS           = require(`./ms`);
const cwd          = process.cwd();

module.exports = (options = {}) => {
  let pkg = {};
  try {
    pkg = require(path.resolve(cwd, `package.json`));
  } catch (e) {}

  pkg.name = pkg.name || options.name;

  if (!pkg.name) { pkg.name = `service-${uuid.v4()}`; }
  const config = simplyconfig
  .create()
  .add({ pkg })
  .add(`../config/config.default.js`)
  .add(`ENV`, { prefix : `BOZZ` })
  .get();

  return new MS(config);
};
