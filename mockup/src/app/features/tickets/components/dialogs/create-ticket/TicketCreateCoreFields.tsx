import React from 'react';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  SAPModule,
  SAP_MODULE_LABELS,
  TicketNature,
  TICKET_NATURE_LABELS,
  User,
} from '@/app/types/entities';
import type { TicketCreateDialogViewModel } from '../../TicketCreateDialog';

interface TicketCreateCoreFieldsProps {
  vm: TicketCreateDialogViewModel;
}

export const TicketCreateCoreFields: React.FC<TicketCreateCoreFieldsProps> = ({ vm }) => {
  return (
    <>
      <div className="space-y-1.5">
        <Label>Project *</Label>
        <Select value={vm.form.projectId} onValueChange={(value) => vm.onFormChange({ ...vm.form, projectId: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            {vm.projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Assign To</Label>
        <Select value={vm.form.assignedTo} onValueChange={(value) => vm.onFormChange({ ...vm.form, assignedTo: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Unassigned" />
          </SelectTrigger>
          <SelectContent>
            {vm.users.filter((user) => user.role !== 'ADMIN').map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label>Title *</Label>
        <Input value={vm.form.title} onChange={(event) => vm.onFormChange({ ...vm.form, title: event.target.value })} />
      </div>
      <div className="space-y-1.5 flex flex-col justify-end">
        <div className="flex items-center justify-between">
          <Label>{vm.isManualWricef ? 'WRICEF ID' : 'Existing Object'}</Label>
          <button type="button" onClick={() => vm.onManualWricefChange(!vm.isManualWricef)} className="text-[10px] text-primary hover:underline hover:text-primary/80">
            {vm.isManualWricef ? 'Select Existing Object' : 'Manual Entry'}
          </button>
        </div>
        {!vm.isManualWricef ? (
          <Select
            value={vm.form.wricefId}
            onValueChange={(value) => {
              const object = vm.wricefObjects.find((item) => item.id === value);
              if (object) {
                vm.onFormChange({ ...vm.form, wricefId: object.id, title: vm.form.title || object.title, description: vm.form.description || object.description, complexity: object.complexity });
              } else {
                vm.onFormChange({ ...vm.form, wricefId: value });
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select imported object" />
            </SelectTrigger>
            <SelectContent>
              {vm.wricefObjects.length > 0 ? (
                vm.wricefObjects.map((object) => (
                  <SelectItem key={object.id} value={object.id}>
                    {object.id} - {object.title}
                  </SelectItem>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">No objects imported for this project.</div>
              )}
            </SelectContent>
          </Select>
        ) : (
          <Input value={vm.form.wricefId} onChange={(event) => vm.onFormChange({ ...vm.form, wricefId: event.target.value })} placeholder="e.g. W-001, R-015" />
        )}
      </div>
      <div className="space-y-1.5">
        <Label>Module *</Label>
        <Select value={vm.form.module} onValueChange={(value) => vm.onFormChange({ ...vm.form, module: value as SAPModule })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SAP_MODULE_LABELS) as SAPModule[]).map((module) => (
              <SelectItem key={module} value={module}>
                {SAP_MODULE_LABELS[module]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Nature *</Label>
        <Select value={vm.form.nature} onValueChange={(value) => vm.onFormChange({ ...vm.form, nature: value as TicketNature })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(['WORKFLOW', 'FORMULAIRE', 'PROGRAMME', 'ENHANCEMENT', 'MODULE', 'REPORT'] as TicketNature[]).map((nature) => (
              <SelectItem key={nature} value={nature}>
                {TICKET_NATURE_LABELS[nature]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
};
