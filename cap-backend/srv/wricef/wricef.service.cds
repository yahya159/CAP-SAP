using { sap.performance.dashboard.db as db } from '../../db/schema';
using { PerformanceService } from '../performance-service';

extend PerformanceService with definitions {
  entity Wricefs as projection on db.Wricefs actions {
    action submitWricef() returns PerformanceService.Wricefs;
    action validateWricef() returns PerformanceService.Wricefs;
    action rejectWricef(reason: String) returns PerformanceService.Wricefs;
  };
  entity WricefObjects as projection on db.WricefObjects actions {
    action approveWricefObject() returns PerformanceService.WricefObjects;
    action rejectWricefObject(reason: String) returns PerformanceService.WricefObjects;
  };
};

