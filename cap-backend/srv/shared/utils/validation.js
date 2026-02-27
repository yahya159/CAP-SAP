'use strict';

const cds = require('@sap/cds');

const assertEntityExists = async (entityName, id, fieldName, req) => {
  if (id === undefined || id === null) return;
  const normalized = String(id).trim();
  if (!normalized) {
    req.error(400, `${fieldName} is required`);
    return;
  }

  const existing = await cds.db.run(
    SELECT.one.from(entityName).columns('ID').where({ ID: normalized })
  );
  if (!existing) req.error(400, `Unknown ${fieldName} '${normalized}'`);
};

const assertDateRange = (startDate, endDate, req) => {
  if (!startDate || !endDate) return;
  if (new Date(endDate).getTime() < new Date(startDate).getTime()) {
    req.error(400, 'endDate must be on or after startDate');
  }
};

const assertPositiveNumber = (value, fieldName, req) => {
  if (value === undefined || value === null) return;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    req.error(400, `${fieldName} must be greater than or equal to 0`);
  }
};

const assertInEnum = (value, allowedValues, fieldName, req) => {
  if (value === undefined || value === null) return;
  if (!allowedValues.includes(value)) {
    req.error(400, `${fieldName} must be one of [${allowedValues.join(', ')}]`);
  }
};

module.exports = {
  assertEntityExists,
  assertDateRange,
  assertPositiveNumber,
  assertInEnum,
};
