import { z } from 'zod';

export const ticketSchema = z.object({
  title: z.string().min(1, 'Ticket title is required'),
  description: z.string().default(''),
  nature: z.enum(['WORKFLOW', 'FORMULAIRE', 'PROGRAMME', 'ENHANCEMENT', 'MODULE', 'REPORT']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  complexity: z.enum(['SIMPLE', 'MOYEN', 'COMPLEXE', 'TRES_COMPLEXE']),
  effortHours: z.number().min(0.5, 'Effort must be greater than 0'),
  dueDate: z.string().default(''),
  wricefObjectId: z.string().default(''),
});

export type TicketFormValues = z.infer<typeof ticketSchema>;
