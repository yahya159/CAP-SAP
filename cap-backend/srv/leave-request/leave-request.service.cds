using { sap.performance.dashboard.db as db } from '../../db/schema';

extend PerformanceService with definitions {
  entity LeaveRequests as projection on db.LeaveRequests;
};

