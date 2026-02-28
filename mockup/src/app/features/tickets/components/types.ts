import { SAPModule, Ticket, TicketComplexity, TicketNature } from '@/app/types/entities';

export type ViewMode = 'list' | 'calendar' | 'kanban';

export interface TicketForm {
  projectId: string;
  assignedTo: string;
  priority: Ticket['priority'];
  nature: TicketNature;
  title: string;
  description: string;
  dueDate: string;
  wricefId: string;
  module: SAPModule;
  estimationHours: number;
  complexity: TicketComplexity;
}

export const EMPTY_FORM: TicketForm = {
  projectId: '',
  assignedTo: '',
  priority: 'MEDIUM',
  nature: 'PROGRAMME',
  title: '',
  description: '',
  dueDate: '',
  wricefId: '',
  module: 'OTHER',
  estimationHours: 0,
  complexity: 'SIMPLE',
};
