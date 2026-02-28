import React from 'react';
import { Paperclip, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import type { CreateDocumentationDialogViewModel } from '../CreateDocumentationDialog';

interface CreateDocumentationAttachmentsProps {
  vm: CreateDocumentationDialogViewModel;
}

export const CreateDocumentationAttachments: React.FC<CreateDocumentationAttachmentsProps> = ({
  vm,
}) => {
  return (
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
          <span className="text-xs text-muted-foreground">{vm.files.length} file(s)</span>
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
  );
};
