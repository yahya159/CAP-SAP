using { sap.performance.dashboard.db as db } from '../../db/schema';

extend PerformanceService with definitions {
  entity Allocations as projection on db.Allocations;
};
  
