'use strict';

const fs = require('node:fs');
const path = require('node:path');
const cds = require('@sap/cds');
const AuthDomainService = require('./auth/auth.domain.service');

const registerDomainImpls = (srv) => {
  const entries = fs.readdirSync(__dirname, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === 'shared') continue;
    const implPath = path.join(__dirname, entry.name, `${entry.name}.impl.js`);
    if (!fs.existsSync(implPath)) continue;
    
    // Only register implementations that belong to the current bounded context
    // This is a naive load-all for now that delegates registration scoping
    // to the individual domains, or we can just load them as long as the srv 
    // exposes the corresponding entities. The domain impls usually check if `srv.entities` contains their target.
    const register = require(implPath);
    if (typeof register === 'function') register(srv);
  }
};

module.exports = function (srv) {
  const auth = new AuthDomainService(srv);

  srv.before('*', (req) => {
    if (auth.isPublicEvent(req.event)) return;
    req._authClaims = auth.authenticateRequest(req);
  });

  registerDomainImpls(srv);
};
