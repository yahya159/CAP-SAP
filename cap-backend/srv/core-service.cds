using from './project/project.service';
using from './reference-data/reference-data.service';
using from './documentation/documentation.service';
using from './deliverable/deliverable.service';
using from './project-feedback/project-feedback.service';
using from './wricef/wricef.service';

using { sap.performance.dashboard.db as db } from '../db/schema';

@path: '/odata/v4/core'
service CoreService {
  @readonly entity Users as projection on db.Users;
  @readonly entity Tickets as projection on db.Tickets;
}
