using { sap.performance.dashboard.db as db } from '../../db/schema';
using { TicketService } from '../ticket-service';

extend TicketService with definitions {
  entity TicketComments as projection on db.TicketComments;
};
