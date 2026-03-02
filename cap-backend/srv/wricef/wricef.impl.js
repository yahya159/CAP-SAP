'use strict';

const WricefDomainService = require('./wricef.domain.service');

module.exports = (srv) => {
  const domain = new WricefDomainService(srv);

  srv.before('CREATE', 'Wricefs', (req) => domain.beforeCreate(req));
  srv.before('UPDATE', 'Wricefs', (req) => domain.beforeUpdateWricef(req));
  srv.before('DELETE', 'Wricefs', (req) => domain.beforeDelete(req));
  srv.on('submitWricef', 'Wricefs', (req) => domain.submitWricef(req));
  srv.on('validateWricef', 'Wricefs', (req) => domain.validateWricef(req));
  srv.on('rejectWricef', 'Wricefs', (req) => domain.rejectWricef(req));

  srv.before('CREATE', 'WricefObjects', (req) => domain.beforeCreateObject(req));
  srv.before('UPDATE', 'WricefObjects', (req) => domain.beforeUpdateObject(req));
  srv.on('approveWricefObject', 'WricefObjects', (req) => domain.approveWricefObject(req));
  srv.on('rejectWricefObject', 'WricefObjects', (req) => domain.rejectWricefObject(req));
};
