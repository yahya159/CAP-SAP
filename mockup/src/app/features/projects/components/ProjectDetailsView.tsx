import React from 'react';
import { useProjectDetailsViewModel } from '../hooks';
import { CreateDocumentationDialog } from './dialogs/CreateDocumentationDialog';
import { CreateProjectTicketDialog } from './dialogs/CreateProjectTicketDialog';
import { ViewDocumentationDialog } from './dialogs/ViewDocumentationDialog';
import { ProjectHeader } from './ProjectHeader';
import { ProjectKpis } from './ProjectKpis';
import { ProjectTabs } from './ProjectTabs';
import { AbaquesPanel } from './panels/AbaquesPanel';
import { DocumentationPanel } from './panels/DocumentationPanel';
import { OverviewPanel } from './panels/OverviewPanel';
import { TeamPanel } from './panels/TeamPanel';
import { TicketsPanel } from './panels/TicketsPanel';
import { WricefPanel } from './panels/WricefPanel';

export const ProjectDetailsView: React.FC = () => {
  const vm = useProjectDetailsViewModel();

  if (vm.loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-8 text-muted-foreground">Loading project details...</div>
      </div>
    );
  }
  if (!vm.project) return null;

  return (
    <div className="min-h-screen bg-background">
      <ProjectHeader projectName={vm.project.name} roleBasePath={vm.roleBasePath} />
      <div className="p-6 space-y-6">
        {vm.error && (
          <div className="rounded border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {vm.error}
          </div>
        )}
        <ProjectTabs
          tabs={vm.tabs}
          activeTab={vm.activeTab}
          onTabChange={vm.setActiveTab}
          onTabKeyDown={vm.handleTabKeyDown}
        />
        <OverviewPanel active={vm.activeTab === 'overview'} vm={vm.overviewVm!} />
        <AbaquesPanel active={vm.activeTab === 'abaques'} vm={vm.abaquesVm!} />
        <TicketsPanel active={vm.activeTab === 'tickets'} vm={vm.ticketsVm} />
        <TeamPanel active={vm.activeTab === 'team'} {...vm.teamVm} />
        <WricefPanel active={vm.activeTab === 'objects'} vm={vm.wricefVm} />
        <ProjectKpis {...vm.kpisVm} />
        <DocumentationPanel active={vm.activeTab === 'docs'} vm={vm.documentationVm!} />
        <CreateProjectTicketDialog
          open={vm.createTicketDialogVm.open}
          vm={vm.createTicketDialogVm.vm}
        />
        <CreateDocumentationDialog
          open={vm.createDocumentationDialogVm.open}
          vm={vm.createDocumentationDialogVm.vm}
        />
        <ViewDocumentationDialog
          open={vm.viewDocumentationDialogVm.open}
          document={vm.viewDocumentationDialogVm.document}
          onOpenChange={vm.viewDocumentationDialogVm.onOpenChange}
          resolveUserName={vm.viewDocumentationDialogVm.resolveUserName}
          formatBytes={vm.viewDocumentationDialogVm.formatBytes}
        />
      </div>
    </div>
  );
};
