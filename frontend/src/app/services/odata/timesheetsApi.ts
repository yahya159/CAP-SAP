import type { Timesheet } from './core';
import { listEntities, createEntity, updateEntity, quoteLiteral } from './core';

const normalizeTimesheet = (entry: Partial<Timesheet>): Timesheet => ({
  id: String(entry.id ?? ''),
  userId: String(entry.userId ?? ''),
  date: String(entry.date ?? ''),
  hours: Number(entry.hours ?? 0) || 0,
  projectId: String(entry.projectId ?? ''),
  ticketId: typeof entry.ticketId === 'string' ? entry.ticketId : undefined,
  comment: typeof entry.comment === 'string' ? entry.comment : undefined,
});

export const TimesheetsAPI = {
  async getByUser(userId: string): Promise<Timesheet[]> {
    const rows = await listEntities<Partial<Timesheet>>('time', 'Timesheets', {
      $filter: `userId eq ${quoteLiteral(userId)}`,
      // Avoid selecting optional columns on stale local SQLite schemas.
      $select: 'ID,userId,date,hours,projectId,comment',
    });
    return rows.map(normalizeTimesheet);
  },

  async create(timesheet: Omit<Timesheet, 'id'>): Promise<Timesheet> {
    return await createEntity<Timesheet>('time', 'Timesheets', timesheet);
  },

  async update(id: string, timesheet: Partial<Timesheet>): Promise<Timesheet> {
    return await updateEntity<Timesheet>('time', 'Timesheets', id, timesheet);
  },
};
