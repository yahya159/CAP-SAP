import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpenText, ExternalLink, Link2, Paperclip, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { DocumentationObjectModal } from './DocumentationObjectModal';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { DocumentationAPI } from '../../services/odataClient';
import {
  DocumentationObject,
  DOCUMENTATION_OBJECT_TYPE_LABELS,
  Ticket,
} from '../../types/entities';

interface TicketDocumentationSectionProps {
  ticket: Ticket;
  currentUserId?: string;
  canEdit: boolean;
  resolveUserName?: (userId: string) => string;
  onDocumentationChanged?: (ticketId: string, documentationIds: string[]) => void;
}

const byRecentUpdate = (a: DocumentationObject, b: DocumentationObject) =>
  (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt);

const formatDate = (value?: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleString();
};

export const TicketDocumentationSection: React.FC<TicketDocumentationSectionProps> = ({
  ticket,
  currentUserId,
  canEdit,
  resolveUserName,
  onDocumentationChanged,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAttachDialogOpen, setIsAttachDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedAttachDocId, setSelectedAttachDocId] = useState('');
  const [isAttaching, setIsAttaching] = useState(false);
  const [relatedDocs, setRelatedDocs] = useState<DocumentationObject[]>([]);
  const [attachableDocs, setAttachableDocs] = useState<DocumentationObject[]>([]);

  const loadDocumentation = useCallback(async () => {
    setLoading(true);
    try {
      const [ticketDocs, projectDocs] = await Promise.all([
        DocumentationAPI.getByTicketId(ticket.id),
        DocumentationAPI.getByProject(ticket.projectId),
      ]);

      const sortedTicketDocs = [...ticketDocs].sort(byRecentUpdate);
      const linkedIds = new Set(sortedTicketDocs.map((doc) => doc.id));
      const sortedAttachableDocs = projectDocs
        .filter((doc) => !linkedIds.has(doc.id))
        .sort(byRecentUpdate);

      setRelatedDocs(sortedTicketDocs);
      setAttachableDocs(sortedAttachableDocs);
      onDocumentationChanged?.(ticket.id, sortedTicketDocs.map((doc) => doc.id));
    } catch {
      toast.error('Failed to load related documentation');
    } finally {
      setLoading(false);
    }
  }, [ticket.id, ticket.projectId, onDocumentationChanged]);

  useEffect(() => {
    void loadDocumentation();
  }, [loadDocumentation]);

  const selectedAttachDoc = useMemo(
    () => attachableDocs.find((doc) => doc.id === selectedAttachDocId),
    [attachableDocs, selectedAttachDocId]
  );

  const attachExistingDocumentation = async () => {
    if (!selectedAttachDoc) {
      toast.error('Select documentation to attach');
      return;
    }

    try {
      setIsAttaching(true);
      await DocumentationAPI.update(selectedAttachDoc.id, {
        relatedTicketIds: [...new Set([...selectedAttachDoc.relatedTicketIds, ticket.id])],
      });
      toast.success('Documentation attached');
      setSelectedAttachDocId('');
      setIsAttachDialogOpen(false);
      await loadDocumentation();
    } catch {
      toast.error('Failed to attach documentation');
    } finally {
      setIsAttaching(false);
    }
  };

  return (
    <>
      <div className="space-y-3 rounded-lg border border-border/70 bg-muted/25 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookOpenText className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Related Documentation</h4>
            <Badge variant="outline">{relatedDocs.length}</Badge>
          </div>

          {canEdit && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAttachDialogOpen(true)}
                disabled={attachableDocs.length === 0}
              >
                <Link2 className="mr-1 h-3.5 w-3.5" />
                Attach Existing Documentation
              </Button>
              <Button size="sm" onClick={() => setIsCreateDialogOpen(true)} disabled={!currentUserId}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                Create New Documentation
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading documentation...</p>
        ) : relatedDocs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No documentation is linked to this ticket yet.
          </p>
        ) : (
          <div className="space-y-2">
            {relatedDocs.map((doc) => (
              <div
                key={doc.id}
                className="rounded-md border border-border/70 bg-card px-3 py-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">{doc.title}</p>
                      <Badge variant="outline">
                        {DOCUMENTATION_OBJECT_TYPE_LABELS[doc.type]}
                      </Badge>
                      <Badge variant="secondary">
                        {doc.relatedTicketIds.length} linked ticket
                        {doc.relatedTicketIds.length > 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{doc.description}</p>
                    <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                      <span>
                        Author: {resolveUserName ? resolveUserName(doc.authorId) : doc.authorId}
                      </span>
                      <span>Updated: {formatDate(doc.updatedAt ?? doc.createdAt)}</span>
                      <span className="inline-flex items-center gap-1">
                        <Paperclip className="h-3 w-3" />
                        {doc.attachedFiles.length} file{doc.attachedFiles.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/shared/documentation/${doc.id}`)}
                  >
                    <ExternalLink className="mr-1 h-3.5 w-3.5" />
                    Open
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isAttachDialogOpen} onOpenChange={setIsAttachDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Attach Existing Documentation</DialogTitle>
            <DialogDescription>
              Select a project documentation object to link it to this ticket.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Label htmlFor="attach-doc-select">Documentation Object</Label>
            <Select value={selectedAttachDocId} onValueChange={setSelectedAttachDocId}>
              <SelectTrigger id="attach-doc-select">
                <SelectValue placeholder="Select documentation to attach" />
              </SelectTrigger>
              <SelectContent>
                {attachableDocs.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    [{DOCUMENTATION_OBJECT_TYPE_LABELS[doc.type]}] {doc.title}
                  </SelectItem>
                ))}
                {attachableDocs.length === 0 && (
                  <SelectItem value="__none" disabled>
                    No attachable documentation for this project
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            {selectedAttachDoc && (
              <div className="rounded-md border border-border/70 bg-muted/30 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">{selectedAttachDoc.title}</p>
                <p className="mt-1">{selectedAttachDoc.description}</p>
                <p className="mt-2">
                  Currently linked to {selectedAttachDoc.relatedTicketIds.length} ticket
                  {selectedAttachDoc.relatedTicketIds.length > 1 ? 's' : ''}.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAttachDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => void attachExistingDocumentation()}
                disabled={!selectedAttachDocId || isAttaching}
              >
                {isAttaching ? 'Attaching...' : 'Attach'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DocumentationObjectModal
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        ticket={ticket}
        currentUserId={currentUserId}
        onCreated={async () => {
          await loadDocumentation();
        }}
      />
    </>
  );
};
