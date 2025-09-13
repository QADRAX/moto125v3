'use strict';

module.exports = [
  {
    method: 'POST',
    path: '/refresh',
    handler: 'refresh.trigger',
    config: { policies: ['admin::isAuthenticatedAdmin'] },
  },
];
