import React, { useMemo, useState } from 'react';
import {
  AbaqueEstimateResult,
  ProjectAbaqueCriteria,
  ProjectCustomizationLevel,
} from '../../types/entities';
import { calculateProjectEstimate } from '../../services/abaqueEngine';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calculator, ShieldAlert, Users2 } from 'lucide-react';

interface AbaqueEstimatorCardProps {
  initialCriteria?: ProjectAbaqueCriteria;
  applying?: boolean;
  onApply: (
    criteria: ProjectAbaqueCriteria,
    result: AbaqueEstimateResult
  ) => void | Promise<void>;
}

function riskClasses(risk: AbaqueEstimateResult['riskLevel']): string {
  if (risk === 'HIGH') return 'border-transparent bg-destructive text-white';
  if (risk === 'MEDIUM') return 'border-transparent bg-amber-500 text-white';
  return 'border-transparent bg-emerald-600 text-white';
}

function complexityClasses(complexity: AbaqueEstimateResult['complexity']): string {
  if (complexity === 'HIGH') return 'border-destructive/40 bg-destructive/10 text-destructive';
  if (complexity === 'MEDIUM') return 'border-amber-500/40 bg-amber-500/10 text-amber-700';
  return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700';
}

export const AbaqueEstimatorCard: React.FC<AbaqueEstimatorCardProps> = ({
  initialCriteria,
  applying = false,
  onApply,
}) => {
  const [customizationLevel, setCustomizationLevel] = useState<ProjectCustomizationLevel>(
    initialCriteria?.customizationLevel ?? 'STANDARD'
  );

  const criteria = useMemo<ProjectAbaqueCriteria>(
    () => ({
      customizationLevel,
    }),
    [customizationLevel]
  );

  const result = useMemo(() => calculateProjectEstimate(criteria), [criteria]);

  return (
    <Card className="border-border/70 bg-gradient-to-br from-card via-card to-muted/40">
      <CardHeader className="border-b border-border/60">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold">
          <Calculator className="h-5 w-5 text-primary" />
          Abaques de Chiffrage
        </CardTitle>
        <CardDescription>
          Scope the project quickly based on complexity and apply a standardized estimate.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 py-6 lg:grid-cols-2">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Complexity / Customization Level</Label>
            <Select
              value={customizationLevel}
              onValueChange={(value) => setCustomizationLevel(value as ProjectCustomizationLevel)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STANDARD">Standard</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH_CUSTOM">High Custom</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              Select the overall complexity to generate a baseline estimate.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-background/90 p-5 transition-all duration-300">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Live Estimate</p>
              <h4 className="text-lg font-semibold text-foreground">Scoping Output</h4>
            </div>
            <Badge className={riskClasses(result.riskLevel)}>
              <ShieldAlert className="h-3 w-3" />
              {result.riskLevel} Risk
            </Badge>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            <Badge variant="outline" className={complexityClasses(result.complexity)}>
              Complexity: {result.complexity}
            </Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3 transition-all duration-300">
              <p className="text-xs text-muted-foreground">Estimated Consulting Days</p>
              <p className="text-2xl font-semibold text-foreground">
                {result.estimatedConsultingDays}
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3 transition-all duration-300">
              <p className="text-xs text-muted-foreground">Recommended Team Size</p>
              <p className="text-2xl font-semibold text-foreground">{result.recommendedTeamSize}</p>
            </div>
          </div>

          <div className="mt-4 text-xs text-muted-foreground">
            The estimate is generated based solely on the selected complexity.
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-end border-t border-border/60">
        <Button
          type="button"
          onClick={() => void onApply(criteria, result)}
          disabled={applying}
        >
          {applying ? 'Applying...' : 'Apply Estimate to Project'}
          <Users2 className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};
