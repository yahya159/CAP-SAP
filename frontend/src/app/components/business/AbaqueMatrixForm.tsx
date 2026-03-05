import React, { useState } from 'react';
import { ProjectAbaqueRow, TicketNature, TicketComplexity, TICKET_NATURE_LABELS, TICKET_COMPLEXITY_LABELS } from '../../types/entities';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Calculator, Plus, Trash2, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface AbaqueMatrixFormProps {
  initialMatrix?: ProjectAbaqueRow[];
  applying?: boolean;
  onApply: (matrix: ProjectAbaqueRow[]) => void | Promise<void>;
  onCancel?: () => void;
}

export const AbaqueMatrixForm: React.FC<AbaqueMatrixFormProps> = ({
  initialMatrix = [],
  applying = false,
  onApply,
  onCancel,
}) => {
  const [rows, setRows] = useState<ProjectAbaqueRow[]>(initialMatrix);

  const handleAddRow = () => {
    setRows([
      ...rows,
      {
        id: crypto.randomUUID(),
        nature: 'ENHANCEMENT',
        complexity: 'SIMPLE',
        hours: 0,
      },
    ]);
  };

  const handleUpdateRow = (id: string, field: keyof ProjectAbaqueRow, value: any) => {
    setRows(rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const handleDeleteRow = (id: string) => {
    setRows(rows.filter((row) => row.id !== id));
  };

  const handleApply = () => {
    onApply(rows);
  };

  return (
    <Card className="border-border/70 bg-card">
      <CardHeader className="border-b border-border/60">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold">
          <Calculator className="h-5 w-5 text-primary" />
          Abaque Matrix (Manual Reference)
        </CardTitle>
        <CardDescription>
          Define estimated hours mapped to Task Nature and Complexity. This acts as a manual baseline reference.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {rows.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
              No entries in the matrix yet. Click "Add Entry" to begin.
            </div>
          ) : (
            <div className="grid gap-4">
              {rows.map((row) => (
                <div key={row.id} className="flex flex-col sm:flex-row gap-3 items-end sm:items-center bg-muted/30 p-3 rounded-lg border">
                  <div className="flex-1 w-full space-y-1">
                    <label className="text-xs font-medium">Task Nature</label>
                    <Select
                      value={row.nature}
                      onValueChange={(val) => handleUpdateRow(row.id, 'nature', val as TicketNature)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TICKET_NATURE_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 w-full space-y-1">
                    <label className="text-xs font-medium">Complexity</label>
                    <Select
                      value={row.complexity}
                      onValueChange={(val) => handleUpdateRow(row.id, 'complexity', val as TicketComplexity)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TICKET_COMPLEXITY_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full sm:w-32 space-y-1">
                    <label className="text-xs font-medium">Estimated Hours</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={row.hours}
                      onChange={(e) => handleUpdateRow(row.id, 'hours', Number(e.target.value))}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive sm:mt-5"
                    onClick={() => handleDeleteRow(row.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddRow}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-3 border-t border-border/60 mt-4 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={applying}>
            Cancel
          </Button>
        )}
        <Button
          type="button"
          onClick={handleApply}
          disabled={applying}
        >
          {applying ? 'Saving...' : 'Save Matrix'}
          <Save className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};
