import React from 'react';
import { Calculator } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import {
  Abaque,
  AbaqueComplexity,
  AbaqueTaskNature,
  Ticket,
  TicketNature,
  WricefObject,
} from '@/app/types/entities';
import { CreateProjectTicketAbaqueReference } from './project-ticket/CreateProjectTicketAbaqueReference';
import { CreateProjectTicketForm } from './project-ticket/CreateProjectTicketForm';

export interface ProjectTicketForm {
  title: string;
  description: string;
  nature: TicketNature;
  priority: Ticket['priority'];
  complexity: AbaqueComplexity;
  effortHours: number;
  dueDate: string;
  wricefObjectId: string;
}

export interface CreateProjectTicketDialogViewModel {
  projectName: string;
  wricefObjects: WricefObject[];
  selectedAbaque: Abaque | null;
  abaqueTaskNatures: AbaqueTaskNature[];
  form: ProjectTicketForm;
  isEstimatedByAbaque: boolean;
  isCreatingTicket: boolean;
  onOpenChange: (open: boolean) => void;
  onFormChange: (form: ProjectTicketForm) => void;
  onEstimatedByAbaqueChange: (value: boolean) => void;
  onApplyAbaqueEstimate: () => void;
  onSubmit: () => void;
  onCancel: () => void;
}

interface CreateProjectTicketDialogProps {
  open: boolean;
  vm: CreateProjectTicketDialogViewModel;
}

export const CreateProjectTicketDialog: React.FC<CreateProjectTicketDialogProps> = ({
  open,
  vm,
}) => {
  return (
    <Dialog open={open} onOpenChange={vm.onOpenChange}>
      <DialogContent className="max-w-5xl sm:max-w-5xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Create Project Ticket
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <CreateProjectTicketForm vm={vm} />
          <div className="space-y-3">
            <div className="text-sm font-medium text-foreground">Abaque Reference</div>
            <CreateProjectTicketAbaqueReference vm={vm} />
          </div>
        </div>
        <DialogFooter className="mt-4 pt-4 sm:justify-end">
          <Button type="button" variant="outline" onClick={vm.onCancel}>
            Cancel
          </Button>
          <Button onClick={vm.onSubmit} disabled={vm.isCreatingTicket}>
            {vm.isCreatingTicket ? 'Creating...' : 'Create Ticket'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
