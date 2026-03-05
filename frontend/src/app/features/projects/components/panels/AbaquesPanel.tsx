import React from 'react';
import { AbaqueMatrixForm } from '@/app/components/business/AbaqueMatrixForm';
import { Button } from '@/app/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import {
  Project,
  ProjectAbaqueRow,
  TICKET_COMPLEXITY_LABELS,
  TICKET_NATURE_LABELS,
} from '@/app/types/entities';
import { Calculator } from 'lucide-react';

export interface AbaquesPanelViewModel {
  project: Project;
  hasAbaqueEstimate: boolean;
  forceEstimatorVisible: boolean;
  projectEstimateSaving: boolean;
  onApplyEstimate: (matrix: ProjectAbaqueRow[]) => Promise<void>;
  onRerunEstimate: () => void;
}

interface AbaquesPanelProps {
  active: boolean;
  vm: AbaquesPanelViewModel;
}

export const AbaquesPanel: React.FC<AbaquesPanelProps> = ({ active, vm }) => {
  if (!active) return null;

  return (
    <section
      id="project-panel-abaques"
      role="tabpanel"
      tabIndex={0}
      aria-labelledby="project-tab-abaques"
      className="space-y-6"
    >
      {!vm.hasAbaqueEstimate || vm.forceEstimatorVisible ? (
        <AbaqueMatrixForm
          initialMatrix={vm.project.abaqueEstimate}
          applying={vm.projectEstimateSaving}
          onApply={vm.onApplyEstimate}
        />
      ) : (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6 border-b border-border/60">
            <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2 text-xl">
              <Calculator className="h-5 w-5 text-primary" />
              Abaque Matrix (Manual Reference)
            </h3>
            <p className="text-sm text-muted-foreground">
              Reference matrix mapping task nature and complexity to estimated effort.
            </p>
          </div>
          <div className="p-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task Nature</TableHead>
                    <TableHead>Complexity</TableHead>
                    <TableHead className="text-right">Estimated Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vm.project.abaqueEstimate?.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        {TICKET_NATURE_LABELS[row.nature] || row.nature}
                      </TableCell>
                      <TableCell>{TICKET_COMPLEXITY_LABELS[row.complexity] || row.complexity}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {row.hours} h
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <div className="flex items-center p-6 pt-0 justify-end">
            <Button variant="outline" onClick={vm.onRerunEstimate}>
              Edit Matrix
            </Button>
          </div>
        </div>
      )}
    </section>
  );
};

