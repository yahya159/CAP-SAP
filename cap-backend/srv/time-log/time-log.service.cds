using { sap.performance.dashboard.db as db } from '../../db/schema';
using { TimeService } from '../time-service';

extend TimeService with definitions {
  entity TimeLogs as projection on db.TimeLogs actions {
    action sendToStraTIME() returns TimeService.TimeLogs;
  };
};

