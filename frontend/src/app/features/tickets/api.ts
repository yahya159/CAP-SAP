import type { ODataRequestOptions } from '../../services/odata/core';
import { NotificationsAPI as ODataNotificationsAPI } from '../../services/odata/notificationsApi';
import { ProjectsAPI as ODataProjectsAPI } from '../../services/odata/projectsApi';
import { TicketsAPI as ODataTicketsAPI } from '../../services/odata/ticketsApi';
import { UsersAPI as ODataUsersAPI } from '../../services/odata/usersApi';
import { Notification, Project, Ticket, User } from '../../types/entities';

export interface ManagerTicketsBootstrapData {
  projects: Project[];
  users: User[];
  tickets: Ticket[];
}

export const ManagerTicketsAPI = {
  async getBootstrapData(requestOptions?: ODataRequestOptions): Promise<ManagerTicketsBootstrapData> {
    const [projects, users, tickets] = await Promise.all([
      ODataProjectsAPI.list({ $orderby: 'name asc' }, requestOptions),
      ODataUsersAPI.getActive(requestOptions),
      ODataTicketsAPI.list({ $orderby: 'createdAt desc' }, requestOptions),
    ]);

    return {
      projects,
      users,
      tickets,
    };
  },


  async updateTicket(id: string, payload: Partial<Ticket>): Promise<Ticket> {
    return await ODataTicketsAPI.update(id, payload);
  },

  async createNotification(
    payload: Omit<Notification, 'id' | 'createdAt'> & { createdAt?: string }
  ): Promise<Notification> {
    return await ODataNotificationsAPI.create(payload);
  },
};
