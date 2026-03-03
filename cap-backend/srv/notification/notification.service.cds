using { sap.performance.dashboard.db as db } from '../../db/schema';

extend UserService with definitions {
  entity Notifications as projection on db.Notifications;
};

