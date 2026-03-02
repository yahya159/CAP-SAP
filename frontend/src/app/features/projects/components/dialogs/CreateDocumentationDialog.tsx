import React from 'react';
import { FilePlus2 } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import {
  DocumentationAttachment,
  DocumentationObjectType,
} from '@/app/types/entities';
import { CreateDocumentationAttachments } from './documentation/CreateDocumentationAttachments';
import { CreateDocumentationFormFields } from './documentation/CreateDocumentationFormFields';

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
          <CreateDocumentationFormFields vm={vm} />
          <CreateDocumentationAttachments vm={vm} />
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
