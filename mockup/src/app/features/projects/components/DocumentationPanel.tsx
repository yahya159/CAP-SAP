import React from 'react';

interface DocumentationPanelProps {
  active: boolean;
  children: React.ReactNode;
}

/**
 * @deprecated Use `features/projects/components/panels/DocumentationPanel` instead.
 */
export const DocumentationPanel: React.FC<DocumentationPanelProps> = ({
  active,
  children,
}) => {
  if (!active) return null;

  return (
    <section
      id="project-panel-docs"
      role="tabpanel"
      tabIndex={0}
      aria-labelledby="project-tab-docs"
      className="space-y-4"
    >
      {children}
    </section>
  );
};
