import React from 'react';
import { FilePlus2, Paperclip, X } from 'lucide-react';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { Textarea } from '../../../../components/ui/textarea';
import {
  DOCUMENTATION_OBJECT_TYPE_LABELS,
  DocumentationAttachment,
  DocumentationObjectType,
} from '../../../../types/entities';

export interface ProjectDocumentationForm {
  title: string;
  description: string;
  type: DocumentationObjectType;
  content: string;
}

export interface CreateDocumentationDialogViewModel {
  docForObjectId: string | null;
  form: ProjectDocumentationForm;
  files: DocumentationAttachment[];
  isCreatingDoc: boolean;
  onOpenChange: (open: boolean) => void;
  onFormChange: (form: ProjectDocumentationForm) => void;
  onAddFiles: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  onSubmit: () => void;
  onCancel: () => void;
  formatBytes: (bytes: number) => string;
}

interface CreateDocumentationDialogProps {
  open: boolean;
  vm: CreateDocumentationDialogViewModel;
}

export const CreateDocumentationDialog: React.FC<CreateDocumentationDialogProps> = ({
  open,
  vm,
}) => {
  return (
    <Dialog open={open} onOpenChange={vm.onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FilePlus2 className="h-5 w-5 text-primary" />
            Create Documentation
            {vm.docForObjectId && (
              <Badge variant="secondary" className="ml-2 text-xs font-normal">
                for {vm.docForObjectId}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="doc-title">Title *</Label>
            <Input
              id="doc-title"
              value={vm.form.title}
              onChange={(event) =>
                vm.onFormChange({ ...vm.form, title: event.target.value })
              }
              placeholder="e.g. SFD - Customer Master Extension"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="doc-type">Type</Label>
              <Select
                value={vm.form.type}
                onValueChange={(value) =>
                  vm.onFormChange({
                    ...vm.form,
                    type: value as DocumentationObjectType,
                  })
                }
              >
                <SelectTrigger id="doc-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    ['SFD', 'GUIDE', 'ARCHITECTURE_DOC', 'GENERAL'] as DocumentationObjectType[]
                  ).map((type) => (
                    <SelectItem key={type} value={type}>
                      {DOCUMENTATION_OBJECT_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="doc-desc">Description</Label>
            <Input
              id="doc-desc"
              value={vm.form.description}
              onChange={(event) =>
                vm.onFormChange({ ...vm.form, description: event.target.value })
              }
              placeholder="Brief description of the document"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="doc-content">Content *</Label>
            <Textarea
              id="doc-content"
              value={vm.form.content}
              onChange={(event) =>
                vm.onFormChange({ ...vm.form, content: event.target.value })
              }
              rows={10}
              placeholder="Document content (markdown supported)..."
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label>Attachments</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => document.getElementById('doc-file-input')?.click()}
              >
                <Paperclip className="h-3.5 w-3.5 mr-1" />
                Attach Files
              </Button>
              <input
                type="file"
                id="doc-file-input"
                className="hidden"
                multiple
                onChange={vm.onAddFiles}
              />
              {vm.files.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {vm.files.length} file(s)
                </span>
              )}
            </div>
            {vm.files.length > 0 && (
              <div className="space-y-1">
                {vm.files.map((file, index) => (
                  <div
                    key={`${file.filename}-${index}`}
                    className="flex items-center justify-between rounded border border-border/60 px-3 py-1.5 text-sm"
                  >
                    <span className="truncate">
                      {file.filename} ({vm.formatBytes(file.size)})
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => vm.onRemoveFile(index)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={vm.onCancel}>
            Cancel
          </Button>
          <Button onClick={vm.onSubmit} disabled={vm.isCreatingDoc}>
            {vm.isCreatingDoc ? 'Creating...' : 'Create Document'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
