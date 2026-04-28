import React from 'react';
import { useTranslation } from 'react-i18next';
import { FilePlus2 } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import {
  DOCUMENTATION_OBJECT_TYPE_LABELS,
  DocumentationObject,
  DocumentationObjectType,
} from '@/app/types/entities';
import { DocumentationTable } from '../tables/DocumentationTable';

export interface DocumentationPanelViewModel {
  projectKeywords: string[];
  documentationObjects: DocumentationObject[];
  docText: string;
  docSaving: boolean;
  onDocTextChange: (value: string) => void;
  onSaveDocText: () => void;
  onCreateDocument: () => void;
  onViewDocument: (docId: string) => void;
  resolveUserName: (userId: string) => string;
  getCountByType: (type: DocumentationObjectType) => number;
}

interface DocumentationPanelProps {
  active: boolean;
  vm: DocumentationPanelViewModel;
}

export const DocumentationPanel: React.FC<DocumentationPanelProps> = ({ active, vm }) => {
  const { t } = useTranslation();
  if (!active) return null;

  return (
    <section
      id="project-panel-docs"
      role="tabpanel"
      tabIndex={0}
      aria-labelledby="project-tab-docs"
      className="space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">{t('projects.details.documentation.stats.total')}</div>
          <div className="text-2xl font-semibold text-foreground">
            {vm.documentationObjects.length}
          </div>
        </div>
        {(['SFD', 'GUIDE', 'ARCHITECTURE_DOC', 'GENERAL'] as DocumentationObjectType[])
          .slice(0, 3)
          .map((type) => (
            <div key={type} className="bg-card border border-border rounded-lg p-4">
              <div className="text-xs text-muted-foreground mb-1">
                {DOCUMENTATION_OBJECT_TYPE_LABELS[type]}
              </div>
              <div className="text-2xl font-semibold text-foreground">
                {vm.getCountByType(type)}
              </div>
            </div>
          ))}
      </div>

      {vm.projectKeywords.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-2">{t('projects.details.documentation.keywords')}</div>
          <div className="flex flex-wrap gap-2">
            {vm.projectKeywords.map((keyword) => (
              <Badge key={keyword} variant="secondary">
                {keyword}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">{t('projects.details.documentation.objects')}</h3>
          <Button size="sm" onClick={vm.onCreateDocument}>
            <FilePlus2 className="h-4 w-4 mr-1.5" />
            {t('projects.details.documentation.create')}
          </Button>
        </div>
        <DocumentationTable
          documentationObjects={vm.documentationObjects}
          resolveUserName={vm.resolveUserName}
          onViewDocument={vm.onViewDocument}
        />
      </div>

      <div className="bg-card border border-border rounded-lg p-5 space-y-3">
        <h3 className="text-lg font-semibold text-foreground">{t('projects.details.documentation.notes')}</h3>
        <Textarea
          value={vm.docText}
          onChange={(event) => vm.onDocTextChange(event.target.value)}
          rows={8}
          placeholder={t('projects.details.documentation.notesPlaceholder')}
          className="font-mono text-sm"
        />
        <div className="flex justify-end">
          <Button disabled={vm.docSaving} onClick={vm.onSaveDocText}>
            {vm.docSaving ? t('projects.details.documentation.savingNotes') : t('projects.details.documentation.saveNotes')}
          </Button>
        </div>
      </div>
    </section>
  );
};
