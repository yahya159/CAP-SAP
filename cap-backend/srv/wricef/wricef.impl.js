'use strict';

const WricefDomainService = require('./wricef.domain.service');

module.exports = (srv) => {
  const domain = new WricefDomainService(srv);

  srv.before('CREATE', 'Wricefs', (req) => domain.beforeCreate(req));
  srv.before('DELETE', 'Wricefs', (req) => domain.beforeDelete(req));

  srv.before('CREATE', 'WricefObjects', (req) => domain.beforeCreateObject(req));
  srv.before('UPDATE', 'WricefObjects', (req) => domain.beforeUpdateObject(req));
};
