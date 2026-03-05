import React from 'react';
import { Calculator } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import {
  Project,
  User,
  UserRole,
  WricefObject,
} from '@/app/types/entities';
import { TicketCreateCoreFields } from './dialogs/create-ticket/TicketCreateCoreFields';
import { TicketCreateEffortFields } from './dialogs/create-ticket/TicketCreateEffortFields';
import { TicketForm } from './types';

export interface TicketCreateDialogViewModel {
  currentUserRole?: UserRole;
  projects: Project[];
  users: User[];
  selectedProject: Project | undefined;
  wricefObjects: WricefObject[];
  form: TicketForm;
  isManualWricef: boolean;
  abaqueSuggestedHours: number | null;
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
        <form onSubmit={vm.onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TicketCreateCoreFields vm={vm} />
          <TicketCreateEffortFields vm={vm} />
        </form>
      </DialogContent>
    </Dialog>
  );
};
