using {sap.performance.dashboard.db as db} from '../../db/schema';

extend CoreService with definitions {
  entity Deliverables as projection on db.Deliverables;
};
