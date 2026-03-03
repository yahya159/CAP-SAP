using from './timesheet/timesheet.service';
using from './time-log/time-log.service';
using from './imputation/imputation.service';
using from './imputation-period/imputation-period.service';
using from './evaluation/evaluation.service';

using { sap.performance.dashboard.db as db } from '../db/schema';

@path: '/odata/v4/time'
service TimeService {
  @readonly entity Users as projection on db.Users;
  @readonly entity Projects as projection on db.Projects;
  @readonly entity Tickets as projection on db.Tickets;
}
