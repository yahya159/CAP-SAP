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
    const register = require(implPath);
    if (typeof register === 'function') register(srv);
  }
};

module.exports = cds.service.impl(function () {
  if (this.name !== 'PerformanceService') return;

  const auth = new AuthDomainService(this);

  this.before('*', (req) => {
    if (auth.isPublicEvent(req.event)) return;
    req._authClaims = auth.authenticateRequest(req);
  });

  registerDomainImpls(this);
});
