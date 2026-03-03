using { sap.performance.dashboard.db as db } from '../../db/schema';
using { TimeService } from '../time-service';

extend TimeService with definitions {
  entity ImputationPeriods as projection on db.ImputationPeriods actions {
    action submit() returns TimeService.ImputationPeriods;
    action validate(validatedBy: String) returns TimeService.ImputationPeriods;
    action rejectEntry(validatedBy: String) returns TimeService.ImputationPeriods;
    action sendToStraTIME(sentBy: String) returns TimeService.ImputationPeriods;
  };
};

