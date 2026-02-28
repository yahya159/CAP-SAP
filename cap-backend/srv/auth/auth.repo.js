'use strict';

const cds = require('@sap/cds');

class AuthRepo {
  async findUserByEmail(email) {
    return cds.db.run(
      SELECT.one
        .from('sap.performance.dashboard.db.Users')
        .columns(
          'ID',
          'name',
          'email',
          'role',
          'active',
          'availabilityPercent',
          'teamId',
          'avatarUrl',
          { skills: ['skill'] },
          { certifications: ['name', 'date'] }
        )
        .where({ email, active: true })
    );
  }

  async listActiveUsers() {
    return cds.db.run(
      SELECT.from('sap.performance.dashboard.db.Users')
        .columns('ID', 'name', 'email', 'role')
        .where({ active: true })
    );
  }
}

module.exports = AuthRepo;
