'use strict';

const AuthDomainService = require('./auth.domain.service');

module.exports = (srv) => {
  const domain = new AuthDomainService(srv);
  srv.on('authenticate', (req) => domain.authenticate(req));
  srv.on('quickAccessAccounts', () => domain.quickAccessAccounts());
};
