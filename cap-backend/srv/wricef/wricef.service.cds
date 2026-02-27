using { sap.performance.dashboard.db as db } from '../../db/schema';

extend PerformanceService with definitions {
  entity Wricefs as projection on db.Wricefs;
  entity WricefObjects as projection on db.WricefObjects;
};

