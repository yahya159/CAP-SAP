import React from 'react';

interface ImputationsPanelProps {
  active: boolean;
  children?: React.ReactNode;
}

export const ImputationsPanel: React.FC<ImputationsPanelProps> = ({ active, children }) => {
  if (!active) return null;

  return (
    <section
      id="project-panel-imputations"
      role="tabpanel"
      tabIndex={0}
      aria-labelledby="project-tab-imputations"
      className="space-y-4"
    >
      {children}
    </section>
  );
};
