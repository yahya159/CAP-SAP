import React from 'react';
import { PageHeader } from '@/app/components/common/PageHeader';

interface ProjectHeaderProps {
  projectName: string;
  roleBasePath: string;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({ projectName, roleBasePath }) => {
  return (
    <PageHeader
      title={projectName}
      subtitle="Project cockpit with overview, tickets, team and documentation"
      breadcrumbs={[
        { label: 'Home', path: `${roleBasePath}/dashboard` },
        { label: 'Projects', path: `${roleBasePath}/projects` },
        { label: projectName },
      ]}
    />
  );
};
