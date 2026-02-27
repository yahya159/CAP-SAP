using { sap.performance.dashboard.db as db } from '../../db/schema';
using { PerformanceService } from '../performance-service';

extend PerformanceService with definitions {
  entity Imputations as projection on db.Imputations actions {
    action validate(validatedBy: String) returns PerformanceService.Imputations;
    action rejectEntry(validatedBy: String) returns PerformanceService.Imputations;
  };
};

