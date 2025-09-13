'use strict';

const routes = require('./server/routes');
const controllers = { refresh: require('./server/controllers/refresh') };
const services = { refresh: require('./server/services/refresh') };

module.exports = {
  register() {},
  bootstrap() {},
  routes,
  controllers,
  services,
};