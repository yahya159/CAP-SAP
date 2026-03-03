using { sap.performance.dashboard.db as db } from '../../db/schema';
using { TimeService } from '../time-service';

extend TimeService with definitions {
  entity Imputations as projection on db.Imputations actions {
    action validate(validatedBy: String) returns TimeService.Imputations;
    action rejectEntry(validatedBy: String) returns TimeService.Imputations;
  };
};

