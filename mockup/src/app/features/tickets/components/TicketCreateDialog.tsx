import React from 'react';
import { Calculator } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import {
  Abaque,
  AbaqueEntry,
  Project,
  User,
  WricefObject,
} from '@/app/types/entities';
import { TicketCreateAbaqueReference } from './dialogs/create-ticket/TicketCreateAbaqueReference';
import { TicketCreateCoreFields } from './dialogs/create-ticket/TicketCreateCoreFields';
import { TicketCreateEffortFields } from './dialogs/create-ticket/TicketCreateEffortFields';
import { TicketForm } from './types';

export interface TicketCreateDialogViewModel {
  projects: Project[];
  users: User[];
  selectedProject: Project | undefined;
  wricefObjects: WricefObject[];
  linkedAbaque: Abaque | null;
  abaqueTicketNatures: string[];
  abaqueEntry: AbaqueEntry | null;
  form: TicketForm;
  isManualWricef: boolean;
  isEstimatedByAbaque: boolean;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: React.FormEvent) => void;
  onFormChange: (form: TicketForm) => void;
  onManualWricefChange: (value: boolean) => void;
  onEstimatedByAbaqueChange: (value: boolean) => void;
  onApplyAbaqueEstimate: () => void;
  onCancel: () => void;
}

interface TicketCreateDialogProps {
  open: boolean;
  vm: TicketCreateDialogViewModel;
}

export const TicketCreateDialog: React.FC<TicketCreateDialogProps> = ({ open, vm }) => {
  return (
    <Dialog open={open} onOpenChange={vm.onOpenChange}>
      <DialogContent className="max-w-5xl sm:max-w-5xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            New Ticket
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <form onSubmit={vm.onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TicketCreateCoreFields vm={vm} />
            <TicketCreateEffortFields vm={vm} />
          </form>

          <div className="space-y-3">
            <div className="text-sm font-medium text-foreground">Abaque Reference</div>
            {vm.selectedProject && (
              <div className="rounded border border-border/70 bg-muted/30 p-3 text-sm">
                <p>
                  <span className="text-muted-foreground">Project:</span> {vm.selectedProject.name}
                </p>
                <p>
                  <span className="text-muted-foreground">Abaque:</span>{' '}
                  {vm.linkedAbaque?.name ?? 'No linked abaque'}
                </p>
              </div>
            )}
            <TicketCreateAbaqueReference vm={vm} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
