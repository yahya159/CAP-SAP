using { sap.performance.dashboard.db as db } from '../../db/schema';

extend PerformanceService with definitions {
  entity Abaques as projection on db.Abaques;
  entity ReferenceData as projection on db.ReferenceData;
};

