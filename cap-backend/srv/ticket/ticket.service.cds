using { sap.performance.dashboard.db as db } from '../../db/schema';
using { PerformanceService } from '../performance-service';

extend PerformanceService with definitions {
  entity Tickets as projection on db.Tickets actions {
    action approveTicket(techConsultantId: String, allocatedHours: Decimal) returns PerformanceService.Tickets;
    action rejectTicket(reason: String) returns PerformanceService.Tickets;
  };
};

