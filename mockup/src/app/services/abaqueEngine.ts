import {
  AbaqueEstimateResult,
  ProjectAbaqueCriteria,
} from '../types/entities';

export function calculateProjectEstimate(criteria: ProjectAbaqueCriteria): AbaqueEstimateResult {
  const isHigh = criteria.customizationLevel === 'HIGH_CUSTOM';
  const isMedium = criteria.customizationLevel === 'MEDIUM';

  const complexity = isHigh ? 'HIGH' : isMedium ? 'MEDIUM' : 'LOW';

  let estimatedConsultingDays = 18;

  if (isHigh) estimatedConsultingDays += 36 + 12; // Base + High Complexity bonus
  else if (isMedium) estimatedConsultingDays += 16;
  else estimatedConsultingDays = Math.max(12, estimatedConsultingDays - 4); // Low complexity reduction

  const riskLevel = complexity;

  const recommendedTeamSize = isHigh ? 4 : isMedium ? 3 : 2;

  return {
    complexity,
    estimatedConsultingDays,
    riskLevel,
    recommendedTeamSize,
  };
}

