using { sap.performance.dashboard.db as db } from '../../db/schema';

extend PerformanceService with definitions {
  entity ProjectFeedback as projection on db.ProjectFeedback;
};
