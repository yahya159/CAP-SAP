import type { ProjectAbaqueRow, TicketComplexity, TicketNature } from '../types/entities';

export const getProjectAbaqueEstimate = (
  matrix: ProjectAbaqueRow[] | undefined,
  nature: TicketNature,
  complexity: TicketComplexity
): number | null => {
  const match = matrix?.find((row) => row.nature === nature && row.complexity === complexity);
  if (!match) return null;

  const hours = Number(match.hours);
  return Number.isFinite(hours) && hours >= 0 ? hours : null;
};
