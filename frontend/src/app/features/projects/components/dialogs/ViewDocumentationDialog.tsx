import React from 'react';
import { Eye, Paperclip } from 'lucide-react';
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
  DOCUMENTATION_OBJECT_TYPE_LABELS,
  DocumentationObject,
} from '@/app/types/entities';

interface ViewDocumentationDialogProps {
  open: boolean;
  document: DocumentationObject | null;
  onOpenChange: (open: boolean) => void;
  resolveUserName: (userId: string) => string;
  formatBytes: (bytes: number) => string;
}

export const ViewDocumentationDialog: React.FC<ViewDocumentationDialogProps> = ({
  open,
  document,
  onOpenChange,
  resolveUserName,
  formatBytes,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {!document ? null : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                {document.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {DOCUMENTATION_OBJECT_TYPE_LABELS[document.type]}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  by {resolveUserName(document.authorId)}
                </span>
              </div>
              {document.description && (
                <p className="text-sm text-muted-foreground">{document.description}</p>
              )}
              <div className="rounded-md border border-border bg-muted/20 p-4">
                <pre className="whitespace-pre-wrap text-sm font-mono">{document.content}</pre>
              </div>
              {document.attachedFiles && document.attachedFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    Attachments ({document.attachedFiles.length})
                  </div>
                  <div className="space-y-1">
                    {document.attachedFiles.map((file, index) => (
                      <div
                        key={`${file.filename}-${index}`}
                        className="flex items-center gap-2 text-sm rounded border border-border/60 px-3 py-1.5"
                      >
                        <Paperclip className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{file.filename}</span>
                        <span className="text-xs text-muted-foreground">
                          ({formatBytes(file.size)})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {document.relatedTicketIds && document.relatedTicketIds.length > 0 && (
                <div className="space-y-1">
                  <div className="text-sm font-medium">Related Tickets</div>
                  <div className="flex flex-wrap gap-1">
                    {document.relatedTicketIds.map((ticketId) => (
                      <Badge key={ticketId} variant="outline" className="text-xs font-mono">
                        {ticketId}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
