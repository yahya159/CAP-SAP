import React from 'react';
import { Ticket } from '@/app/types/entities';

interface TicketKPIsProps {
  tickets: Ticket[];
}

export const TicketKPIs: React.FC<TicketKPIsProps> = ({ tickets: _tickets }) => {
  // Intentionally no-op to preserve the existing page UI while exposing a KPI composition slot.
  return null;
};
