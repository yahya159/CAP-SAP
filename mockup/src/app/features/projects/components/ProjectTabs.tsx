import React from 'react';

export interface ProjectTabDefinition<TTabKey extends string> {
  key: TTabKey;
  label: string;
  icon?: React.ReactNode;
}

interface ProjectTabsProps<TTabKey extends string> {
  tabs: Array<ProjectTabDefinition<TTabKey>>;
  activeTab: TTabKey;
  onTabChange: (tab: TTabKey) => void;
  onTabKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>, tab: TTabKey) => void;
}

export const ProjectTabs = <TTabKey extends string>({
  tabs,
  activeTab,
  onTabChange,
  onTabKeyDown,
}: ProjectTabsProps<TTabKey>) => {
  return (
    <div className="overflow-x-auto">
      <div role="tablist" aria-label="Project detail sections" className="flex min-w-max gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              id={`project-tab-${tab.key}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`project-panel-${tab.key}`}
              tabIndex={isActive ? 0 : -1}
              onKeyDown={(event) => onTabKeyDown(event, tab.key)}
              onClick={() => onTabChange(tab.key)}
              className={`rounded border px-4 py-2 text-sm whitespace-nowrap flex items-center gap-1.5 ${
                isActive
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground hover:bg-accent'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
