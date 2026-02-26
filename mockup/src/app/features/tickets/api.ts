import {
  AbaquesAPI as ODataAbaquesAPI,
  NotificationsAPI as ODataNotificationsAPI,
  ProjectsAPI as ODataProjectsAPI,
  TicketsAPI as ODataTicketsAPI,
  UsersAPI as ODataUsersAPI,
  type ODataRequestOptions,
} from '../../services/odataClient';
import { Abaque, Notification, Project, Ticket, User } from '../../types/entities';

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

  async getAbaqueById(abaqueId: string): Promise<Abaque | null> {
    return await ODataAbaquesAPI.getById(abaqueId);
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
