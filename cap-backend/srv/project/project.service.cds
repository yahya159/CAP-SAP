using { sap.performance.dashboard.db as db } from '../../db/schema';

extend CoreService with definitions {
  entity Projects as projection on db.Projects;
};

