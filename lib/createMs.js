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

  pkg.name = options.name || pkg.name;

  if (!pkg.name) { pkg.name = `service-${uuid.v4()}`; }

  options.name = pkg.name;

  const config = simplyconfig
  .create()
  .add({ pkg })
  .add(`../config/config.default.js`)
  .add(options)
  .add(`ENV`, { prefix : `BOZZ` })
  .get();

  return new MS(config);
};
