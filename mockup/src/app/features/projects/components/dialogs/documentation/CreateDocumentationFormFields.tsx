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
import { Textarea } from '@/app/components/ui/textarea';
import {
  DOCUMENTATION_OBJECT_TYPE_LABELS,
  DocumentationObjectType,
} from '@/app/types/entities';
import type { CreateDocumentationDialogViewModel } from '../CreateDocumentationDialog';

interface CreateDocumentationFormFieldsProps {
  vm: CreateDocumentationDialogViewModel;
}

export const CreateDocumentationFormFields: React.FC<CreateDocumentationFormFieldsProps> = ({
  vm,
}) => {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="doc-title">Title *</Label>
        <Input
          id="doc-title"
          value={vm.form.title}
          onChange={(event) => vm.onFormChange({ ...vm.form, title: event.target.value })}
          placeholder="e.g. SFD - Customer Master Extension"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="doc-type">Type</Label>
          <Select
            value={vm.form.type}
            onValueChange={(value) =>
              vm.onFormChange({ ...vm.form, type: value as DocumentationObjectType })
            }
          >
            <SelectTrigger id="doc-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(['SFD', 'GUIDE', 'ARCHITECTURE_DOC', 'GENERAL'] as DocumentationObjectType[]).map(
                (type) => (
                  <SelectItem key={type} value={type}>
                    {DOCUMENTATION_OBJECT_TYPE_LABELS[type]}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="doc-desc">Description</Label>
        <Input
          id="doc-desc"
          value={vm.form.description}
          onChange={(event) => vm.onFormChange({ ...vm.form, description: event.target.value })}
          placeholder="Brief description of the document"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="doc-content">Content *</Label>
        <Textarea
          id="doc-content"
          value={vm.form.content}
          onChange={(event) => vm.onFormChange({ ...vm.form, content: event.target.value })}
          rows={10}
          placeholder="Document content (markdown supported)..."
          className="font-mono text-sm"
        />
      </div>
    </>
  );
};
