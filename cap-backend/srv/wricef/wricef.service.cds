using { sap.performance.dashboard.db as db } from '../../db/schema';
using { CoreService } from '../core-service';

extend CoreService with definitions {
  entity Wricefs as projection on db.Wricefs actions {
    action submitWricef() returns CoreService.Wricefs;
    action validateWricef() returns CoreService.Wricefs;
    action rejectWricef(reason: String) returns CoreService.Wricefs;
  };
  entity WricefObjects as projection on db.WricefObjects actions {
    action approveWricefObject() returns CoreService.WricefObjects;
    action rejectWricefObject(reason: String) returns CoreService.WricefObjects;
  };
};

