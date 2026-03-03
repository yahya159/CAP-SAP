import type { Notification } from './core';
import { listEntities, updateEntity, createEntity, quoteLiteral } from './core';

export const NotificationsAPI = {
  async getByUser(userId: string): Promise<Notification[]> {
    return await listEntities<Notification>('user', 'Notifications', {
      $filter: `userId eq ${quoteLiteral(userId)}`,
    });
  },

  async markAsRead(id: string): Promise<void> {
    await updateEntity<Notification>('user', 'Notifications', id, { read: true });
  },

  async create(
    notification: Omit<Notification, 'id' | 'createdAt'> & { createdAt?: string }
  ): Promise<Notification> {
    return await createEntity<Notification>('user', 'Notifications', notification);
  },
};
