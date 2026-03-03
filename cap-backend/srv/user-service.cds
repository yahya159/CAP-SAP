using from './user/user.service';
using from './auth/auth.service';
using from './allocation/allocation.service';
using from './leave-request/leave-request.service';
using from './notification/notification.service';

using { sap.performance.dashboard.db as db } from '../db/schema';

@path: '/odata/v4/user'
service UserService {
  @readonly entity Projects as projection on db.Projects;
  @readonly entity Tickets as projection on db.Tickets;
}
