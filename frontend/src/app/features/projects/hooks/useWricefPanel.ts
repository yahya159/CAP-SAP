import { useState, useMemo, useCallback } from 'react';
import { useProjectWricefObjects, useProjectTickets, useProjectDocumentation, useActiveUsers } from '../queries';
import { WricefType, TicketComplexity, SAPModule, WricefObject } from '@/app/types/entities';
import { filterProjectObjects, paginateItems, buildWricefObjectTicketStats, buildObjectTicketRows, WRICEF_TYPE_BADGE_CLASS, COMPLEXITY_BADGE_CLASS, WRICEF_STATUS_COLOR, WRICEF_PRIORITY_COLOR } from '../model';

export const useWricefPanel = (projectId: string) => {
  const { data: wricefObjects = [] } = useProjectWricefObjects(projectId);
  const { data: tickets = [] } = useProjectTickets(projectId);
  const { data: documentationObjects = [] } = useProjectDocumentation(projectId);
  const { data: users = [] } = useActiveUsers();

  const [objectsSearch, setObjectsSearch] = useState('');
  const [objectsTypeFilter, setObjectsTypeFilter] = useState<WricefType | ''>('');
  const [objectsComplexityFilter, setObjectsComplexityFilter] = useState<TicketComplexity | ''>('');
  const [objectsModuleFilter, setObjectsModuleFilter] = useState<SAPModule | ''>('');
  const [objectsPage, setObjectsPage] = useState(1);
  const [objectsPageSize, setObjectsPageSize] = useState(10);
  const [expandedObjectIds, setExpandedObjectIds] = useState<Set<string>>(new Set());

  const wricefTotalTickets = useMemo(
    () => tickets.filter((ticket) => wricefObjects.some((object) => object.id === ticket.wricefId)).length,
    [wricefObjects, tickets]
  );
  
  const wricefTotalDocuments = useMemo(
    () => wricefObjects.reduce((sum, object) => sum + (object.documentationObjectIds?.length ?? 0), 0),
    [wricefObjects]
  );

  const wricefObjectTicketStats = useMemo(
    () => buildWricefObjectTicketStats(wricefObjects, tickets),
    [wricefObjects, tickets]
  );

  const filteredObjects = useMemo(
    () => filterProjectObjects(wricefObjects, objectsSearch, objectsTypeFilter, objectsComplexityFilter, objectsModuleFilter),
    [wricefObjects, objectsSearch, objectsTypeFilter, objectsComplexityFilter, objectsModuleFilter]
  );

  const objectsTotalPages = Math.max(1, Math.ceil(filteredObjects.length / objectsPageSize));
  
  const paginatedObjects = useMemo(
    () => paginateItems(filteredObjects, objectsPage, objectsPageSize),
    [filteredObjects, objectsPage, objectsPageSize]
  );

  const toggleExpandObject = useCallback((objectId: string) => {
    setExpandedObjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(objectId)) next.delete(objectId);
      else next.add(objectId);
      return next;
    });
  }, []);

  const getObjectTicketRows = useCallback(
    (object: WricefObject) => buildObjectTicketRows(object, tickets),
    [tickets]
  );

  const resolveUserName = useCallback(
    (userId: string) => {
      const user = users.find((u: any) => u.id === userId);
      return user ? user.name ?? user.email ?? userId : userId;
    },
    [users]
  );

  const getObjectDocs = useCallback(
    (object: WricefObject) => {
      const docsById = new Map(documentationObjects.map(d => [d.id, d]));
      return (object.documentationObjectIds ?? [])
        .map((docId) => docsById.get(docId))
        .filter((doc): doc is any => Boolean(doc));
    },
    [documentationObjects]
  );

  return {
    objectsSearch,
    objectsTypeFilter,
    objectsComplexityFilter,
    objectsModuleFilter,
    objectsPage,
    objectsPageSize,
    objectsTotalPages,
    filteredObjectsCount: filteredObjects.length,
    wricefObjectCount: wricefObjects.length,
    wricefTotalTickets,
    wricefTotalDocuments,
    wricefImporting: false,
    onObjectsSearchChange: (value: string) => { setObjectsSearch(value); setObjectsPage(1); },
    onObjectsTypeFilterChange: (value: WricefType | '') => { setObjectsTypeFilter(value); setObjectsPage(1); },
    onObjectsComplexityFilterChange: (value: TicketComplexity | '') => { setObjectsComplexityFilter(value); setObjectsPage(1); },
    onObjectsModuleFilterChange: (value: SAPModule | '') => { setObjectsModuleFilter(value); setObjectsPage(1); },
    onObjectsPageChange: setObjectsPage,
    onObjectsPageSizeChange: (value: number) => { setObjectsPageSize(value); setObjectsPage(1); },
    onClearFilters: () => {
      setObjectsSearch(''); setObjectsTypeFilter(''); setObjectsComplexityFilter(''); setObjectsModuleFilter(''); setObjectsPage(1);
    },
    table: {
      objects: paginatedObjects,
      expandedObjectIds,
      wricefObjectTicketStats,
      wricefTypeBadgeClass: WRICEF_TYPE_BADGE_CLASS,
      complexityBadgeClass: COMPLEXITY_BADGE_CLASS,
      wricefStatusColor: WRICEF_STATUS_COLOR,
      wricefPriorityColor: WRICEF_PRIORITY_COLOR,
      getObjectTicketRows,
      getObjectDocs,
      resolveUserName,
      onToggleExpandObject: toggleExpandObject,
      emptyMessage: wricefObjects.length === 0
        ? 'No WRICEF objects imported yet. Upload a WRICEF Excel file to get started.'
        : 'No objects match the current filters.',
    },
  };
};