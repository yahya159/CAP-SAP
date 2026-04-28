import React from 'react';
import { NavLink } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  Clock,
  FolderKanban,
  Gauge,
  LayoutDashboard,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Ticket,
  TriangleAlert,
  UserRound,
  Users,
  Wrench,
  ChevronLeft,
  ChevronRight,
  Award,
  CalendarDays,
  BookOpenText,
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';
import { useAuth } from '../../context/AuthContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import {
  getSidebarItemsForRole,
  NavigationIconKey,
  SidebarNavItem,
} from '../../routing/routeRegistry';

const APP_NAME = 'Performance Hub';
const BRAND_NAME = 'Inetum';

const sidebarIconMap: Record<NavigationIconKey, React.ComponentType<{ className?: string }>> = {
  shield: Shield,
  users: Users,
  'sliders-horizontal': SlidersHorizontal,
  'bar-chart-3': BarChart3,
  'folder-kanban': FolderKanban,
  'layout-dashboard': LayoutDashboard,
  'triangle-alert': TriangleAlert,
  ticket: Ticket,
  'book-open-text': BookOpenText,
  award: Award,
  'calendar-days': CalendarDays,
  clock: Clock,
  gauge: Gauge,
  wrench: Wrench,
  sparkles: Sparkles,
};

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  mobileOpen,
  onCloseMobile,
  onToggleCollapse,
}) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  const items = getSidebarItemsForRole(currentUser.role);

  const sections = items.reduce<Record<string, SidebarNavItem[]>>((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {});

  const renderSidebarContent = (mobile = false) => {
    const compact = !mobile && collapsed;

    return (
      <div className="flex h-full flex-col bg-sidebar">
        <div
          className={cn(
            'flex h-16 items-center border-b border-sidebar-border px-4',
            compact ? 'justify-center' : 'justify-between'
          )}
        >
          <div className={cn('flex items-center gap-3', compact && 'justify-center')}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
              <LayoutDashboard className="h-4 w-4" />
            </div>
            {!compact && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  {BRAND_NAME}
                </p>
                <p className="text-sm font-semibold text-sidebar-foreground">{APP_NAME}</p>
              </div>
            )}
          </div>

          {!mobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              aria-label={compact ? t('common.expandSidebar') : t('common.collapseSidebar')}
            >
              {compact ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          {Object.entries(sections).map(([sectionName, sectionItems]) => (
            <div key={sectionName} className="mb-5 last:mb-0">
              {!compact && (
                <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {t(`sidebar.sections.${sectionName}`, sectionName)}
                </p>
              )}
              <div className="space-y-1.5">
                {sectionItems.map((item) => {
                  const Icon = sidebarIconMap[item.iconKey];

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      title={compact ? t(`sidebar.items.${item.label}`, item.label) : undefined}
                      onClick={() => mobile && onCloseMobile()}
                      className={({ isActive }) =>
                        cn(
                          'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground',
                          compact && 'justify-center'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className={cn(
                              'h-4 w-4 shrink-0',
                              isActive ? 'text-primary' : 'text-sidebar-foreground/70'
                            )}
                          />
                          {!compact && (
                            <span className="truncate font-medium">
                              {t(`sidebar.items.${item.label}`, item.label)}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className={cn('border-t border-sidebar-border p-3', collapsed && !mobile ? 'px-2' : 'px-3')}>
          <div
            className={cn(
              'flex items-center gap-3 rounded-lg bg-surface-2 p-2',
              collapsed && !mobile && 'justify-center'
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
              <UserRound className="h-4 w-4" />
            </div>
            {(!collapsed || mobile) && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-sidebar-foreground">{currentUser.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {t(`roles.${currentUser.role}`)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <aside
        className={cn(
          'hidden shrink-0 border-r border-sidebar-border transition-[width] duration-300 md:block',
          collapsed ? 'w-[92px]' : 'w-[280px]'
        )}
      >
        {renderSidebarContent(false)}
      </aside>

      <Sheet open={mobileOpen} onOpenChange={(open) => !open && onCloseMobile()}>
        <SheetContent side="left" className="p-0 w-[280px]">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          {renderSidebarContent(true)}
        </SheetContent>
      </Sheet>
    </>
  );
};
