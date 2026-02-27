'use strict';

const NotificationDomainService = require('./notification.domain.service');

module.exports = (srv) => {
  const domain = new NotificationDomainService(srv);

  srv.before('CREATE', 'Notifications', (req) => domain.beforeCreate(req));
};
