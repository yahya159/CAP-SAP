using { sap.performance.dashboard.db as db } from '../../db/schema';

extend CoreService with definitions {
  entity ReferenceData as projection on db.ReferenceData;
};

