using { sap.performance.dashboard.db as db } from '../../db/schema';
using { PerformanceService } from '../performance-service';

extend PerformanceService with definitions {
  entity TimeLogs as projection on db.TimeLogs actions {
    action sendToStraTIME() returns PerformanceService.TimeLogs;
  };
};

