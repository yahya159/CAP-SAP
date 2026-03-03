'use strict';
const cds = require('@sap/cds');
const baseService = require('./base-service');

module.exports = cds.service.impl(function () {
  baseService(this);
});
