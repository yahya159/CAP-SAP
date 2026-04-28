import React from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { Resolver, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Imputation, Ticket } from '@/app/types/entities';
import { imputationSchema, ImputationFormValues } from '../schema';
import { useAuth } from '@/app/context/AuthContext';
import { getBaseRouteForRole } from '@/app/context/roleRouting';

interface AddImputationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string;
  imputationsByDate: Record<string, Imputation[]>;
  hoursByDate: Record<string, number>;
  myTickets: Ticket[];
  tickets: Ticket[];
  onAdd: (values: ImputationFormValues) => void;
}

export const AddImputationDialog: React.FC<AddImputationDialogProps> = ({
  open,
  onOpenChange,
  selectedDate,
  imputationsByDate,
  hoursByDate,
  myTickets,
  tickets,
  onAdd,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const roleBasePath = currentUser ? getBaseRouteForRole(currentUser.role) : '';

  const form = useForm<ImputationFormValues>({
    resolver: zodResolver(imputationSchema) as Resolver<ImputationFormValues>,
    defaultValues: {
      ticketId: '',
      hours: 0,
      description: '',
    },
  });

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      form.reset({ ticketId: '', hours: 0, description: '' });
    }
  }, [open, form]);

  const onSubmit = (values: ImputationFormValues) => {
    onAdd(values);
  };

  const ticketLabel = (id: string) => {
    const t = tickets.find((tk) => tk.id === id);
    return t ? `${t.ticketCode} - ${t.title}` : id;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('imputations.addTitle', { date: selectedDate })}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {(imputationsByDate[selectedDate] || []).length > 0 && (
            <div className="rounded border bg-muted/30 p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2">{t('imputations.alreadyLogged')}</p>
              {(imputationsByDate[selectedDate] || []).map((imp) => (
                <div key={imp.id} className="flex items-center justify-between py-1 text-sm">
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => navigate(`${roleBasePath}/tickets/${imp.ticketId}`)}
                  >
                    {ticketLabel(imp.ticketId)}
                  </button>
                  <span className="font-bold">{imp.hours}h</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-1 border-t mt-1">
                <span className="text-xs font-semibold">{t('imputations.total')}</span>
                <span className="text-sm font-bold">{hoursByDate[selectedDate] || 0}h</span>
              </div>
            </div>
          )}

          <div>
            <Label>{t('imputations.ticketLabel')}</Label>
            <Select
              value={form.watch('ticketId')}
              onValueChange={(v) => form.setValue('ticketId', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('imputations.selectTicket')} />
              </SelectTrigger>
              <SelectContent>
                {myTickets.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.ticketCode} - {t.title} ({t.module ?? '-'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.ticketId && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.ticketId.message}</p>
            )}
          </div>
          <div>
            <Label>{t('imputations.hoursLabel')}</Label>
            <Input
              type="number"
              min={0.5}
              max={12}
              step={0.5}
              {...form.register('hours', { valueAsNumber: true })}
            />
            {form.formState.errors.hours && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.hours.message}</p>
            )}
          </div>
          <div>
            <Label>{t('imputations.descriptionLabel')}</Label>
            <Textarea
              {...form.register('description')}
              rows={2}
              placeholder={t('imputations.descriptionPlaceholder')}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('imputations.cancel')}
            </Button>
            <Button type="submit">
              <Plus className="h-4 w-4 mr-1" /> {t('imputations.add')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
