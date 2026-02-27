using { sap.performance.dashboard.db as db } from '../../db/schema';

extend PerformanceService with definitions {
  entity Timesheets as projection on db.Timesheets;
};

