import React from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/app/components/common/PageHeader';

interface ProjectHeaderProps {
  projectName: string;
  roleBasePath: string;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({ projectName, roleBasePath }) => {
  const { t } = useTranslation();

  return (
    <PageHeader
      title={projectName}
      subtitle={t('projects.details.subtitle')}
      breadcrumbs={[
        { label: t('common.home'), path: `${roleBasePath}/dashboard` },
        { label: t('sidebar.items.Projects'), path: `${roleBasePath}/projects` },
        { label: projectName },
      ]}
    />
  );
};
