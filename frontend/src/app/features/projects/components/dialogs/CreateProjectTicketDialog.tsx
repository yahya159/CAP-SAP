import React, { useState } from 'react';
import { Calculator } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { CreateProjectTicketForm } from './project-ticket/CreateProjectTicketForm';
import { ticketSchema, TicketFormValues } from './project-ticket/schema';
import { useProjectDetails, useProjectWricefObjects, useProjectTickets, projectKeys } from '../../queries';
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
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [isCreatingTicket, setIsCreatingTicket] = useState(false);

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
        complexity: values.complexity === 'HIGH' || values.complexity === 'CRITICAL' ? 'COMPLEXE' : values.complexity === 'MEDIUM' ? 'MOYEN' : 'SIMPLE',
        estimationHours: values.effortHours,
        estimatedViaAbaque: false,
        selectedWricefObjectId: values.wricefObjectId || undefined,
        creationComment: 'Ticket created with manual estimation',
      });
      
      queryClient.invalidateQueries({ queryKey: projectKeys.tickets(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.details(projectId) });
      
      form.reset();
      onOpenChange(false);
      toast.success('Ticket created successfully');
    } catch {
      toast.error('Failed to create ticket');
    } finally {
      setIsCreatingTicket(false);
    }
  };

  const vm = {
    projectName: project?.name ?? '',
    wricefObjects,
    formValues: form.watch(),
    setValue: form.setValue,
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
          <VisuallyHidden>
            <DialogDescription>
              Create a new ticket manually mapping estimation, priority, and complexity.
            </DialogDescription>
          </VisuallyHidden>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-5">
            <CreateProjectTicketForm vm={vm} />
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
