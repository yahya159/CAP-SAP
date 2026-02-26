import React from 'react';
import {
  ChevronDown,
  ChevronRight,
  Eye,
  FilePlus2,
  FileText,
  Paperclip,
  Plus,
  Ticket as TicketIcon,
} from 'lucide-react';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../components/ui/table';
import {
  DOCUMENTATION_OBJECT_TYPE_LABELS,
  DocumentationObject,
  SAP_MODULE_LABELS,
  Ticket,
  TicketComplexity,
  TicketStatus,
  TICKET_COMPLEXITY_LABELS,
  TICKET_STATUS_LABELS,
  WricefObject,
  WricefType,
  WRICEF_TYPE_LABELS,
} from '../../../../types/entities';

// the deprecated WricefTicketRow is removed

export interface WricefTableViewModel {
  objects: WricefObject[];
  expandedObjectIds: Set<string>;
  wricefObjectTicketStats: Map<string, { available: number }>;
  wricefTypeBadgeClass: Record<WricefType, string>;
  complexityBadgeClass: Record<TicketComplexity, string>;
  wricefStatusColor: Record<TicketStatus, string>;
  wricefPriorityColor: Record<string, string>;
  getObjectTicketRows: (object: WricefObject) => Ticket[];
  getObjectDocs: (object: WricefObject) => DocumentationObject[];
  resolveUserName: (userId: string) => string;
  onToggleExpandObject: (objectId: string) => void;
  onOpenCreateTicket: (objectId: string) => void;
  onOpenCreateDocument: (objectId: string) => void;
  onOpenTicketDetails: (ticketId: string) => void;
  onViewDocument: (docId: string) => void;
  emptyMessage: string;
}

interface WricefTableProps {
  vm: WricefTableViewModel;
}

export const WricefTable: React.FC<WricefTableProps> = ({ vm }) => {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="px-3 w-10"></TableHead>
            <TableHead className="px-3">Object ID</TableHead>
            <TableHead className="px-3">Type</TableHead>
            <TableHead className="px-3">Title</TableHead>
            <TableHead className="px-3">Complexity</TableHead>
            <TableHead className="px-3">Module</TableHead>
            <TableHead className="px-3 text-center">Tickets</TableHead>
            <TableHead className="px-3 text-center">Documents</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vm.objects.map((object) => {
            const isExpanded = vm.expandedObjectIds.has(object.id);
            const ticketRows = isExpanded ? vm.getObjectTicketRows(object) : [];
            const stats = vm.wricefObjectTicketStats.get(object.id);
            const ticketCount = stats?.available ?? 0;
            const docCount = object.documentationObjectIds?.length ?? 0;

            return (
              <React.Fragment key={object.id}>
                <TableRow
                  className="cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => vm.onToggleExpandObject(object.id)}
                >
                  <TableCell className="px-3 py-3">
                    <button type="button" className="p-0.5 rounded hover:bg-muted">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="px-3 py-3 font-mono text-sm font-medium">
                    {object.id}
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <Badge className={`text-xs ${vm.wricefTypeBadgeClass[object.type]}`}>
                      {WRICEF_TYPE_LABELS[object.type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <div className="font-medium text-sm">{object.title}</div>
                    {object.description && (
                      <div className="text-xs text-muted-foreground line-clamp-1 max-w-[300px]">
                        {object.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <Badge className={`text-xs ${vm.complexityBadgeClass[object.complexity]}`}>
                      {TICKET_COMPLEXITY_LABELS[object.complexity]}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-3 text-sm">
                    {SAP_MODULE_LABELS[object.module]}
                  </TableCell>
                  <TableCell className="px-3 py-3 text-center">
                    <span className="inline-flex items-center gap-1 text-sm">
                      <TicketIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      {ticketCount}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-3 text-center">
                    <span className="inline-flex items-center gap-1 text-sm">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      {docCount}
                    </span>
                  </TableCell>
                </TableRow>

                {isExpanded && (
                  <TableRow>
                    <TableCell colSpan={8} className="p-0">
                      <div className="bg-muted/20 border-t border-b border-border/50 px-6 py-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-foreground">
                            Tickets for {object.id}
                          </h4>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(event) => {
                              event.stopPropagation();
                              vm.onOpenCreateTicket(object.id);
                            }}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Add Ticket
                          </Button>
                        </div>
                        {ticketRows.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-2">
                            No tickets for this object.
                          </p>
                        ) : (
                          <div className="rounded-md border border-border/70 overflow-hidden">
                            <Table>
                              <TableHeader className="bg-muted/40">
                                <TableRow>
                                  <TableHead className="px-3 text-xs">Ticket ID</TableHead>
                                  <TableHead className="px-3 text-xs">Title</TableHead>
                                  <TableHead className="px-3 text-xs">Status</TableHead>
                                  <TableHead className="px-3 text-xs">Priority</TableHead>
                                  <TableHead className="px-3 text-xs">Live Ticket</TableHead>
                                  <TableHead className="px-3 text-xs">Estimation</TableHead>
                                  <TableHead className="px-3 text-xs">Effort</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {ticketRows.map((ticket) => {
                                  return (
                                    <TableRow
                                      key={ticket.id}
                                      className="hover:bg-muted/30"
                                    >
                                      <TableCell className="px-3 py-2 text-xs font-mono">
                                        {ticket.ticketCode}
                                      </TableCell>
                                      <TableCell className="px-3 py-2 text-sm">{ticket.title}</TableCell>
                                      <TableCell className="px-3 py-2">
                                        {ticket.status ? (
                                          <Badge className={`text-[10px] ${vm.wricefStatusColor[ticket.status]}`}>
                                            {TICKET_STATUS_LABELS[ticket.status]}
                                          </Badge>
                                        ) : (
                                          <span className="text-xs text-muted-foreground">N/A</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="px-3 py-2">
                                        {ticket.priority ? (
                                          <Badge className={`text-[10px] ${vm.wricefPriorityColor[ticket.priority]}`}>
                                            {ticket.priority}
                                          </Badge>
                                        ) : (
                                          <span className="text-xs text-muted-foreground">N/A</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="px-3 py-2 text-sm">
                                        <button
                                          type="button"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            vm.onOpenTicketDetails(ticket.id);
                                          }}
                                          className="font-mono text-xs text-primary hover:underline"
                                        >
                                          {ticket.ticketCode || 'View'}
                                        </button>
                                      </TableCell>
                                      <TableCell className="px-3 py-2 text-sm text-muted-foreground">
                                        {ticket.estimationHours}h
                                      </TableCell>
                                      <TableCell className="px-3 py-2 text-sm">
                                        <span
                                          className={
                                            ticket.effortHours > ticket.estimationHours
                                              ? 'font-medium text-red-600 dark:text-red-400'
                                              : undefined
                                          }
                                        >
                                          {ticket.effortHours}h
                                        </span>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        )}

                        <div className="mt-4 pt-3 border-t border-border/40">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-foreground">
                              Documents for {object.id}
                            </h4>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(event) => {
                                event.stopPropagation();
                                vm.onOpenCreateDocument(object.id);
                              }}
                            >
                              <FilePlus2 className="h-3.5 w-3.5 mr-1" />
                              Add Document
                            </Button>
                          </div>
                          {(() => {
                            const objectDocs = vm.getObjectDocs(object);
                            return objectDocs.length === 0 ? (
                              <p className="text-sm text-muted-foreground py-2">
                                No documents for this object.
                              </p>
                            ) : (
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
                                        <TableCell className="px-3 py-2 text-sm font-medium">
                                          {doc.title}
                                        </TableCell>
                                        <TableCell className="px-3 py-2">
                                          <Badge variant="secondary" className="text-[10px]">
                                            {DOCUMENTATION_OBJECT_TYPE_LABELS[doc.type]}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="px-3 py-2 text-sm text-muted-foreground">
                                          {vm.resolveUserName(doc.authorId)}
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
                                              vm.onViewDocument(doc.id);
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
                          })()}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
          {vm.objects.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                {vm.emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
