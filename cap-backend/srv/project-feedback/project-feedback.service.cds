using { sap.performance.dashboard.db as db } from '../../db/schema';

extend CoreService with definitions {
  entity ProjectFeedback as projection on db.ProjectFeedback;
};
