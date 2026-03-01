import React, { useState } from 'react';
import { Calculator } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { CreateProjectTicketAbaqueReference } from './project-ticket/CreateProjectTicketAbaqueReference';
import { CreateProjectTicketForm } from './project-ticket/CreateProjectTicketForm';
import { ticketSchema, TicketFormValues } from './project-ticket/schema';
import { useProjectDetails, useProjectWricefObjects, useAbaques, useProjectTickets, projectKeys } from '../../queries';
import { buildAbaqueTaskNatures, TICKET_COMPLEXITY_BY_ABAQUE, getAbaqueEstimateForNature } from '../../model';
import { toast } from 'sonner';
import { useAuth } from '@/app/context/AuthContext';
import { createTicketWithUnifiedFlow } from '@/app/services/ticketCreation';
import { useQueryClient } from '@tanstack/react-query';

interface CreateProjectTicketDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultWricefObjectId?: string;
}

export const CreateProjectTicketDialog: React.FC<CreateProjectTicketDialogProps> = ({
  projectId,
  open,
  onOpenChange,
  defaultWricefObjectId,
}) => {
  const { data: project } = useProjectDetails(projectId);
  const { data: wricefObjects = [] } = useProjectWricefObjects(projectId);
  const { data: tickets = [] } = useProjectTickets(projectId);
  const { data: abaques = [] } = useAbaques();
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [isEstimatedByAbaque, setIsEstimatedByAbaque] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  const selectedAbaque = abaques.find((a) => a.id === project?.linkedAbaqueId) ?? null;
  const abaqueTaskNatures = buildAbaqueTaskNatures(selectedAbaque);

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema as any),
    defaultValues: {
      title: '',
      description: '',
      nature: 'ENHANCEMENT',
      priority: 'MEDIUM',
      complexity: 'LOW',
      effortHours: 0,
      dueDate: '',
      wricefObjectId: defaultWricefObjectId || '',
    },
  });

  const onSubmit = async (values: any) => {
    if (!project || !currentUser) return;
    try {
      setIsCreatingTicket(true);
      await createTicketWithUnifiedFlow({
        project,
        wricefObjects,
        existingProjectTickets: tickets,
        createdBy: currentUser.id,
        priority: values.priority,
        nature: values.nature,
        title: values.title.trim(),
        description: values.description.trim(),
        dueDate: values.dueDate || undefined,
        module: 'OTHER',
        complexity: TICKET_COMPLEXITY_BY_ABAQUE[values.complexity as keyof typeof TICKET_COMPLEXITY_BY_ABAQUE],
        estimationHours: values.effortHours,
        estimatedViaAbaque: isEstimatedByAbaque,
        selectedWricefObjectId: values.wricefObjectId || undefined,
        creationComment: isEstimatedByAbaque
          ? 'Ticket created with abaque-based estimation'
          : 'Ticket created with manual estimation',
      });
      
      queryClient.invalidateQueries({ queryKey: projectKeys.tickets(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.details(projectId) });
      
      form.reset();
      setIsEstimatedByAbaque(false);
      onOpenChange(false);
      toast.success('Ticket created successfully');
    } catch {
      toast.error('Failed to create ticket');
    } finally {
      setIsCreatingTicket(false);
    }
  };

  const applyAbaqueEstimate = () => {
    if (!selectedAbaque) {
      toast.error('No abaque linked to this project');
      return;
    }
    const currentNature = form.getValues('nature');
    const currentComplexity = form.getValues('complexity');
    const estimate = getAbaqueEstimateForNature(selectedAbaque, currentNature, currentComplexity);
    
    if (estimate === null) {
      toast.error('No matching abaque entry for selected nature and complexity');
      return;
    }
    form.setValue('effortHours', estimate);
    setIsEstimatedByAbaque(true);
    toast.success('Effort pre-filled from project abaque');
  };

  // We pass a vm object down to children just to avoid massive refactoring of form children
  const vm = {
    projectName: project?.name ?? '',
    wricefObjects,
    selectedAbaque,
    abaqueTaskNatures,
    formValues: form.watch(),
    setValue: form.setValue,
    isEstimatedByAbaque,
    onEstimatedByAbaqueChange: setIsEstimatedByAbaque,
    onApplyAbaqueEstimate: applyAbaqueEstimate,
    register: form.register,
    errors: form.formState.errors,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl sm:max-w-5xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Create Project Ticket
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <CreateProjectTicketForm vm={vm} />
            <div className="space-y-3">
              <div className="text-sm font-medium text-foreground">Abaque Reference</div>
              <CreateProjectTicketAbaqueReference vm={vm} />
            </div>
          </div>
          <DialogFooter className="mt-4 pt-4 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreatingTicket}>
              {isCreatingTicket ? 'Creating...' : 'Create Ticket'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
