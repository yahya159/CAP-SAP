using { sap.performance.dashboard.db as db } from '../../db/schema';
using { PerformanceService } from '../performance-service';

extend PerformanceService with definitions {
  entity ImputationPeriods as projection on db.ImputationPeriods actions {
    action submit() returns PerformanceService.ImputationPeriods;
    action validate(validatedBy: String) returns PerformanceService.ImputationPeriods;
    action rejectEntry(validatedBy: String) returns PerformanceService.ImputationPeriods;
    action sendToStraTIME(sentBy: String) returns PerformanceService.ImputationPeriods;
  };
};

