import React from 'react';
import { useTranslation } from 'react-i18next';
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
} from '@/app/types/entities';
import type { TicketCreateDialogViewModel } from '../../TicketCreateDialog';

interface TicketCreateCoreFieldsProps {
  vm: TicketCreateDialogViewModel;
}

export const TicketCreateCoreFields: React.FC<TicketCreateCoreFieldsProps> = ({ vm }) => {
  const { t } = useTranslation();
  const isFuncConsultant = vm.currentUserRole === 'CONSULTANT_FONCTIONNEL';

  return (
    <>
      <div className="space-y-1.5">
        <Label>{t('tickets.create.project')}</Label>
        <Select value={vm.form.projectId} onValueChange={(value) => vm.onFormChange({ ...vm.form, projectId: value })}>
          <SelectTrigger>
            <SelectValue placeholder={t('tickets.create.selectProject')} />
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
      {/* Functional Consultants cannot assign — Manager assigns after approval */}
      {!isFuncConsultant && (
        <div className="space-y-1.5">
          <Label>{t('tickets.create.assignTo')}</Label>
          <Select value={vm.form.assignedTo} onValueChange={(value) => vm.onFormChange({ ...vm.form, assignedTo: value })}>
            <SelectTrigger>
              <SelectValue placeholder={t('tickets.create.unassigned')} />
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
      )}
      <div className="space-y-1.5 sm:col-span-2">
        <Label>{t('tickets.create.ticketTitle')}</Label>
        <Input value={vm.form.title} onChange={(event) => vm.onFormChange({ ...vm.form, title: event.target.value })} />
      </div>
      <div className="space-y-1.5 flex flex-col justify-end">
        <div className="flex items-center justify-between">
          <Label>{vm.isManualWricef ? t('tickets.create.wricefId') : t('tickets.create.existingObject')}</Label>
          <button type="button" onClick={() => vm.onManualWricefChange(!vm.isManualWricef)} className="text-[10px] text-primary hover:underline hover:text-primary/80">
            {vm.isManualWricef ? t('tickets.create.selectExisting') : t('tickets.create.manualEntry')}
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
              <SelectValue placeholder={t('tickets.create.selectImported')} />
            </SelectTrigger>
            <SelectContent>
              {vm.wricefObjects.length > 0 ? (
                vm.wricefObjects.map((object) => (
                  <SelectItem key={object.id} value={object.id}>
                    {object.id} - {object.title}
                  </SelectItem>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">{t('tickets.create.noObjects')}</div>
              )}
            </SelectContent>
          </Select>
        ) : (
          <Input value={vm.form.wricefId} onChange={(event) => vm.onFormChange({ ...vm.form, wricefId: event.target.value })} placeholder="e.g. W-001, R-015" />
        )}
      </div>
      <div className="space-y-1.5">
        <Label>{t('tickets.create.module')}</Label>
        <Select value={vm.form.module} onValueChange={(value) => vm.onFormChange({ ...vm.form, module: value as SAPModule })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SAP_MODULE_LABELS) as SAPModule[]).map((module) => (
              <SelectItem key={module} value={module}>
                {t(`entities.sapModule.${module}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>{t('tickets.create.nature')}</Label>
        <Select value={vm.form.nature} onValueChange={(value) => vm.onFormChange({ ...vm.form, nature: value as TicketNature })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(['WORKFLOW', 'FORMULAIRE', 'PROGRAMME', 'ENHANCEMENT', 'MODULE', 'REPORT'] as TicketNature[]).map((nature) => (
              <SelectItem key={nature} value={nature}>
                {t(`entities.ticketNature.${nature}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
};
