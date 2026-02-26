import type { LeaveRequest } from './core';
import { listEntities, createEntity, updateEntity, quoteLiteral } from './core';

export const LeaveRequestsAPI = {
  async getAll(): Promise<LeaveRequest[]> {
    return await listEntities<LeaveRequest>('LeaveRequests');
  },

  async getByConsultant(consultantId: string): Promise<LeaveRequest[]> {
    return await listEntities<LeaveRequest>('LeaveRequests', {
      $filter: `consultantId eq ${quoteLiteral(consultantId)}`,
    });
  },

  async create(leaveRequest: Omit<LeaveRequest, 'id' | 'createdAt'>): Promise<LeaveRequest> {
    return await createEntity<LeaveRequest>('LeaveRequests', leaveRequest);
  },

  async update(id: string, data: Partial<LeaveRequest>): Promise<LeaveRequest> {
    return await updateEntity<LeaveRequest>('LeaveRequests', id, data);
  },
};
