import React from 'react';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from '@/app/components/ui/table';
import {
  DocumentationObject,
  Ticket,
  TicketComplexity,
  TicketStatus,
  WricefObject,
  WricefType,
} from '@/app/types/entities';
import { WricefObjectExpandedRow } from './wricef/WricefObjectExpandedRow';
import { WricefObjectMainRow } from './wricef/WricefObjectMainRow';

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
            const objectDocs = isExpanded ? vm.getObjectDocs(object) : [];
            const ticketCount = vm.wricefObjectTicketStats.get(object.id)?.available ?? 0;
            const docCount = object.documentationObjectIds?.length ?? 0;

            return (
              <React.Fragment key={object.id}>
                <WricefObjectMainRow
                  object={object}
                  isExpanded={isExpanded}
                  ticketCount={ticketCount}
                  docCount={docCount}
                  wricefTypeBadgeClass={vm.wricefTypeBadgeClass}
                  complexityBadgeClass={vm.complexityBadgeClass}
                  onToggleExpandObject={vm.onToggleExpandObject}
                />
                {isExpanded && (
                  <WricefObjectExpandedRow
                    object={object}
                    ticketRows={ticketRows}
                    objectDocs={objectDocs}
                    wricefStatusColor={vm.wricefStatusColor}
                    wricefPriorityColor={vm.wricefPriorityColor}
                    resolveUserName={vm.resolveUserName}
                    onOpenCreateTicket={vm.onOpenCreateTicket}
                    onOpenCreateDocument={vm.onOpenCreateDocument}
                    onOpenTicketDetails={vm.onOpenTicketDetails}
                    onViewDocument={vm.onViewDocument}
                  />
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
