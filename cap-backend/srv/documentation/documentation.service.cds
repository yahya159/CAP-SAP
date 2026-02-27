using { sap.performance.dashboard.db as db } from '../../db/schema';

extend PerformanceService with definitions {
  entity DocumentationObjects as projection on db.DocumentationObjects;
};

