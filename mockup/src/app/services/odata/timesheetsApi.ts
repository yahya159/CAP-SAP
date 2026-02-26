import type { Timesheet } from './core';
import { listEntities, createEntity, updateEntity, quoteLiteral } from './core';

export const TimesheetsAPI = {
  async getByUser(userId: string): Promise<Timesheet[]> {
    return await listEntities<Timesheet>('Timesheets', {
      $filter: `userId eq ${quoteLiteral(userId)}`,
    });
  },

  async create(timesheet: Omit<Timesheet, 'id'>): Promise<Timesheet> {
    return await createEntity<Timesheet>('Timesheets', timesheet);
  },

  async update(id: string, timesheet: Partial<Timesheet>): Promise<Timesheet> {
    return await updateEntity<Timesheet>('Timesheets', id, timesheet);
  },
};
