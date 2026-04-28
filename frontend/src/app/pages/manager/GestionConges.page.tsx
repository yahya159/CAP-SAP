import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/common/PageHeader';
import { LeaveRequestsAPI } from '../../services/odata/leaveRequestsApi';
import { NotificationsAPI } from '../../services/odata/notificationsApi';
import { UsersAPI } from '../../services/odata/usersApi';
import { LeaveRequest, LeaveStatus, User } from '../../types/entities';
import { useAuth } from '../../context/AuthContext';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';

const statusColor: Record<LeaveStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export const GestionConges: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<LeaveStatus | 'ALL'>('ALL');

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqData, userData] = await Promise.all([
        LeaveRequestsAPI.getAll(),
        UsersAPI.getAll(),
      ]);
      setRequests(reqData.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setUsers(userData);
    } finally {
      setLoading(false);
    }
  };

  const userName = (id: string) => users.find((u) => u.id === id)?.name ?? id;

  const handleDecision = async (req: LeaveRequest, decision: 'APPROVED' | 'REJECTED') => {
    if (!currentUser) return;
    try {
      const updated = await LeaveRequestsAPI.update(req.id, {
        status: decision,
        managerId: currentUser.id,
        reviewedAt: new Date().toISOString(),
      });
      setRequests((prev) => prev.map((r) => (r.id === req.id ? updated : r)));

      const decisionLabel = t(`entities.leaveStatus.${decision}`).toLowerCase();

      // Notify the consultant
      await NotificationsAPI.create({
        userId: req.consultantId,
        type: 'LEAVE_DECISION',
        title: t('dashboard.leaves.notifications.decisionTitle', { decision: decisionLabel }),
        message: t('dashboard.leaves.notifications.decisionMessage', {
          start: req.startDate,
          end: req.endDate,
          decision: decisionLabel,
        }),
        read: false,
      });

      toast.success(t('dashboard.leaves.toasts.success', { decision: decisionLabel }));
    } catch {
      toast.error(t('dashboard.leaves.toasts.error'));
    }
  };

  const filtered = useMemo(() => {
    if (filter === 'ALL') return requests;
    return requests.filter((r) => r.status === filter);
  }, [requests, filter]);

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  // Timeline: approved leaves grouped by consultant
  const timeline = useMemo(() => {
    const approved = requests.filter((r) => r.status === 'APPROVED');
    const map: Record<string, LeaveRequest[]> = {};
    approved.forEach((r) => {
      if (!map[r.consultantId]) map[r.consultantId] = [];
      map[r.consultantId].push(r);
    });
    return Object.entries(map).map(([id, leaves]) => ({
      user: users.find((u) => u.id === id),
      leaves: leaves.sort((a, b) => a.startDate.localeCompare(b.startDate)),
    }));
  }, [requests, users]);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={t('dashboard.leaves.title')}
        subtitle={t('dashboard.leaves.subtitle')}
        breadcrumbs={[
          { label: t('documentation.home'), path: '/manager/dashboard' },
          { label: t('dashboard.leaves.title') },
        ]}
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-semibold text-foreground">{requests.length}</div>
            <div className="text-xs text-muted-foreground">{t('dashboard.leaves.stats.total')}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-semibold text-yellow-600">{pendingCount}</div>
            <div className="text-xs text-muted-foreground">{t('dashboard.leaves.stats.pending')}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-semibold text-green-600">
              {requests.filter((r) => r.status === 'APPROVED').length}
            </div>
            <div className="text-xs text-muted-foreground">{t('dashboard.leaves.stats.approved')}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-semibold text-red-600">
              {requests.filter((r) => r.status === 'REJECTED').length}
            </div>
            <div className="text-xs text-muted-foreground">{t('dashboard.leaves.stats.rejected')}</div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder={t('dashboard.leaves.filters.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t('dashboard.leaves.filters.allStatuses')}</SelectItem>
              <SelectItem value="PENDING">{t('entities.leaveStatus.PENDING')}</SelectItem>
              <SelectItem value="APPROVED">{t('entities.leaveStatus.APPROVED')}</SelectItem>
              <SelectItem value="REJECTED">{t('entities.leaveStatus.REJECTED')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {loading ? (
          <p className="text-muted-foreground">{t('documentation.loading')}</p>
        ) : (
          <div className="rounded-lg border bg-card overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="px-4">{t('dashboard.leaves.table.consultant')}</TableHead>
                  <TableHead className="px-4">{t('dashboard.leaves.table.start')}</TableHead>
                  <TableHead className="px-4">{t('dashboard.leaves.table.end')}</TableHead>
                  <TableHead className="px-4">{t('dashboard.leaves.table.days')}</TableHead>
                  <TableHead className="px-4">{t('dashboard.leaves.table.reason')}</TableHead>
                  <TableHead className="px-4">{t('dashboard.leaves.filters.status')}</TableHead>
                  <TableHead className="px-4">{t('dashboard.leaves.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((req) => {
                  const days =
                    Math.ceil(
                      (new Date(req.endDate).getTime() - new Date(req.startDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                    ) + 1;
                  return (
                    <TableRow key={req.id}>
                      <TableCell className="px-4 py-3 font-medium">
                        {userName(req.consultantId)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm">
                        {new Date(req.startDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm">
                        {new Date(req.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm font-medium">{days}</TableCell>
                      <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                        {req.reason || '-'}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge className={statusColor[req.status]}>
                          {t(`entities.leaveStatus.${req.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {req.status === 'PENDING' ? (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600"
                              onClick={() => void handleDecision(req, 'APPROVED')}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => void handleDecision(req, 'REJECTED')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {req.reviewedAt ? new Date(req.reviewedAt).toLocaleDateString() : '-'}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      {t('dashboard.leaves.table.noRequests')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Team Availability Timeline */}
        {timeline.length > 0 && (
          <div className="rounded-lg border bg-card p-5 space-y-3">
            <h3 className="text-lg font-semibold text-foreground">
              {t('dashboard.leaves.availability.title')}
            </h3>
            <div className="space-y-2">
              {timeline.map(({ user, leaves }) => (
                <div key={user?.id ?? 'unknown'} className="flex items-center gap-3">
                  <span className="w-36 text-sm font-medium text-foreground truncate">
                    {user?.name ?? t('dashboard.leaves.availability.unknown')}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {leaves.map((l) => (
                      <span
                        key={l.id}
                        className="inline-block rounded bg-primary/10 px-2 py-0.5 text-xs text-primary"
                      >
                        {new Date(l.startDate).toLocaleDateString()} –{' '}
                        {new Date(l.endDate).toLocaleDateString()}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
