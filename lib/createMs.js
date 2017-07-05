'use strict';

const path         = require(`path`);
const extend       = require(`extend`);
const simplyconfig = require(`simplyconfig`);
const MS           = require(`./ms`);
const cwd          = process.cwd();
const pkg          = require(path.resolve(cwd, `package.json`));

module.exports = (options = {}) => {
  const config = simplyconfig
  .create()
  .add({ pkg })
  .add(`../config/config.default.js`)
  .add(`ENV`, { prefix : `BOZZ` })
  .get();

  return new MS(config);
};
