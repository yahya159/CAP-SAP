import React from 'react';

interface WricefPanelProps {
  active: boolean;
  children: React.ReactNode;
}

/**
 * @deprecated Use `features/projects/components/panels/WricefPanel` instead.
 */
export const WricefPanel: React.FC<WricefPanelProps> = ({ active, children }) => {
  if (!active) return null;

  return (
    <section
      id="project-panel-objects"
      role="tabpanel"
      tabIndex={0}
      aria-labelledby="project-tab-objects"
      className="space-y-4"
    >
      {children}
    </section>
  );
};
