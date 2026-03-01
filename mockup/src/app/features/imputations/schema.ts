import { z } from 'zod';

export const imputationSchema = z.object({
  ticketId: z.string().min(1, 'Ticket selection is required'),
  hours: z.number().min(0.5, 'Must be at least 0.5 hours').max(12, 'Cannot exceed 12 hours'),
  description: z.string().default(''),
});

export type ImputationFormValues = z.infer<typeof imputationSchema>;
