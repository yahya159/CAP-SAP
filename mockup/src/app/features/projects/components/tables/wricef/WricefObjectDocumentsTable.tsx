import React from 'react';
import { Eye, Paperclip } from 'lucide-react';
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
import { DOCUMENTATION_OBJECT_TYPE_LABELS, DocumentationObject } from '@/app/types/entities';

interface WricefObjectDocumentsTableProps {
  objectDocs: DocumentationObject[];
  resolveUserName: (userId: string) => string;
  onViewDocument: (docId: string) => void;
}

export const WricefObjectDocumentsTable: React.FC<WricefObjectDocumentsTableProps> = ({
  objectDocs,
  resolveUserName,
  onViewDocument,
}) => {
  if (objectDocs.length === 0) {
    return <p className="text-sm text-muted-foreground py-2">No documents for this object.</p>;
  }

  return (
    <div className="rounded-md border border-border/70 overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead className="px-3 text-xs">Title</TableHead>
            <TableHead className="px-3 text-xs">Type</TableHead>
            <TableHead className="px-3 text-xs">Author</TableHead>
            <TableHead className="px-3 text-xs text-center">Files</TableHead>
            <TableHead className="px-3 text-xs text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {objectDocs.map((doc) => (
            <TableRow key={doc.id} className="hover:bg-muted/30">
              <TableCell className="px-3 py-2 text-sm font-medium">{doc.title}</TableCell>
              <TableCell className="px-3 py-2">
                <Badge variant="secondary" className="text-[10px]">
                  {DOCUMENTATION_OBJECT_TYPE_LABELS[doc.type]}
                </Badge>
              </TableCell>
              <TableCell className="px-3 py-2 text-sm text-muted-foreground">
                {resolveUserName(doc.authorId)}
              </TableCell>
              <TableCell className="px-3 py-2 text-center">
                <span className="inline-flex items-center gap-1 text-xs">
                  <Paperclip className="h-3 w-3 text-muted-foreground" />
                  {doc.attachedFiles?.length ?? 0}
                </span>
              </TableCell>
              <TableCell className="px-3 py-2 text-center">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  onClick={(event) => {
                    event.stopPropagation();
                    onViewDocument(doc.id);
                  }}
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
