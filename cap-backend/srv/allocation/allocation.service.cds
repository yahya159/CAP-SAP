using { sap.performance.dashboard.db as db } from '../../db/schema';

extend UserService with definitions {
  entity Allocations as projection on db.Allocations;
};
  
