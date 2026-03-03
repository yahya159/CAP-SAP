using { sap.performance.dashboard.db as db } from '../../db/schema';

extend TimeService with definitions {
  entity Evaluations as projection on db.Evaluations;
};

