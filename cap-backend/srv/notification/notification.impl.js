'use strict';

const NotificationDomainService = require('./notification.domain.service');

module.exports = (srv) => {
  const domain = new NotificationDomainService(srv);

  srv.before('READ', 'Notifications', (req) => domain.beforeRead(req));
  srv.before('CREATE', 'Notifications', (req) => domain.beforeCreate(req));
  srv.before('UPDATE', 'Notifications', (req) => domain.beforeUpdate(req));
  srv.before('DELETE', 'Notifications', (req) => domain.beforeDelete(req));
};
