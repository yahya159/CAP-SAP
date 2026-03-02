using { sap.performance.dashboard.db as db } from '../../db/schema';
using { PerformanceService } from '../performance-service';

extend PerformanceService with definitions {
  entity TicketComments as projection on db.TicketComments;
};
