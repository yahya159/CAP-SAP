import React from 'react';
import { Eye, FileText, Paperclip } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import {
  DOCUMENTATION_OBJECT_TYPE_LABELS,
  DocumentationObject,
} from '@/app/types/entities';

interface DocumentationTableProps {
  documentationObjects: DocumentationObject[];
  resolveUserName: (userId: string) => string;
  onViewDocument: (docId: string) => void;
}

export const DocumentationTable: React.FC<DocumentationTableProps> = ({
  documentationObjects,
  resolveUserName,
  onViewDocument,
}) => {
  if (documentationObjects.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No documentation objects yet.</p>
        <p className="text-xs text-muted-foreground">
          Create your first document or link one from a WRICEF object.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-3">Title</TableHead>
            <TableHead className="px-3">Type</TableHead>
            <TableHead className="px-3">Author</TableHead>
            <TableHead className="px-3 text-center">Files</TableHead>
            <TableHead className="px-3 text-center">Linked Tickets</TableHead>
            <TableHead className="px-3 text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documentationObjects.map((doc) => (
            <TableRow key={doc.id} className="hover:bg-muted/40">
              <TableCell className="px-3 py-2">
                <div className="font-medium text-sm">{doc.title}</div>
                {doc.description && (
                  <div className="text-xs text-muted-foreground line-clamp-1 max-w-[320px]">
                    {doc.description}
                  </div>
                )}
              </TableCell>
              <TableCell className="px-3 py-2">
                <Badge variant="secondary" className="text-xs">
                  {DOCUMENTATION_OBJECT_TYPE_LABELS[doc.type]}
                </Badge>
              </TableCell>
              <TableCell className="px-3 py-2 text-sm text-muted-foreground">
                {resolveUserName(doc.authorId)}
              </TableCell>
              <TableCell className="px-3 py-2 text-center">
                <span className="inline-flex items-center gap-1 text-sm">
                  <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                  {doc.attachedFiles?.length ?? 0}
                </span>
              </TableCell>
              <TableCell className="px-3 py-2 text-center text-sm">
                {doc.relatedTicketIds?.length ?? 0}
              </TableCell>
              <TableCell className="px-3 py-2 text-center">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  onClick={() => onViewDocument(doc.id)}
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
