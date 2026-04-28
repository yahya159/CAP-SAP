import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Package,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
import { Separator } from '../../components/ui/separator';
import { Textarea } from '../../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { WricefsAPI } from '../../services/odata/wricefsApi';
import { WricefObjectsAPI } from '../../services/odata/wricefObjectsApi';
import { ProjectsAPI } from '../../services/odata/projectsApi';
import { TicketsAPI } from '../../services/odata/ticketsApi';
import { UsersAPI } from '../../services/odata/usersApi';
import {
  type Project,
  type User,
  type Wricef,
  type WricefObject,
  type WricefValidationStatus,
} from '../../types/entities';
import type { Ticket as TicketEntity } from '../../types/entities';

// ── helpers ──────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<WricefValidationStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  PENDING_VALIDATION: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  VALIDATED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

// ════════════════════════════════════════════════════════════════════════════
// Component
// ════════════════════════════════════════════════════════════════════════════

export const WricefValidation: React.FC = () => {
  const { t } = useTranslation();
  const [wricefs, setWricefs] = useState<Wricef[]>([]);
  const [allObjects, setAllObjects] = useState<WricefObject[]>([]);
  const [allTickets, setAllTickets] = useState<TicketEntity[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // reject dialog
  const [rejectTarget, setRejectTarget] = useState<Wricef | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // reject object dialog
  const [rejectObjTarget, setRejectObjTarget] = useState<WricefObject | null>(null);
  const [objRejectionReason, setObjRejectionReason] = useState('');

  // ── data loading ──
  const loadData = useCallback(async () => {
    try {
      const [w, p, objs, t, u] = await Promise.all([
        WricefsAPI.getByStatus('PENDING_VALIDATION'),
        ProjectsAPI.getAll(),
        WricefObjectsAPI.getAll(),
        TicketsAPI.getAll(),
        UsersAPI.getAll(),
      ]);
      setWricefs(w);
      setProjects(p);
      setAllObjects(objs);
      setAllTickets(t);
      setUsers(u);

      // Auto-select first if nothing selected
      if (w.length > 0 && !selectedId) {
        setSelectedId(w[0].id);
      }
    } catch {
      toast.error(t('wricefValidation.toasts.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t, selectedId]);

  useEffect(() => { void loadData(); }, [loadData]);

  // ── derived maps ──
  const projectMap = useMemo(() => {
    const m = new Map<string, Project>();
    for (const p of projects) m.set(p.id, p);
    return m;
  }, [projects]);

  const userMap = useMemo(() => {
    const m = new Map<string, User>();
    for (const u of users) m.set(u.id, u);
    return m;
  }, [users]);

  const objectsByWricef = useMemo(() => {
    const m: Record<string, WricefObject[]> = {};
    for (const o of allObjects) (m[o.wricefId] ??= []).push(o);
    return m;
  }, [allObjects]);

  const ticketsByObjectId = useMemo(() => {
    const m: Record<string, TicketEntity[]> = {};
    for (const t of allTickets) {
      if (t.wricefId) (m[t.wricefId] ??= []).push(t);
    }
    return m;
  }, [allTickets]);

  const selected = wricefs.find((w) => w.id === selectedId) ?? null;
  const selectedObjects = selected ? objectsByWricef[selected.id] ?? [] : [];

  // ── actions ──
  const handleValidate = async (wricef: Wricef) => {
    setSubmitting(true);
    try {
      await WricefsAPI.validateWricef(wricef.id);
      toast.success(t('wricefValidation.toasts.validated'), {
        description: t('wricefValidation.toasts.validatedDesc', { name: wricef.sourceFileName }),
      });
      // Remove from list and select next
      setWricefs((prev) => {
        const next = prev.filter((w) => w.id !== wricef.id);
        if (selectedId === wricef.id) {
          setSelectedId(next[0]?.id ?? null);
        }
        return next;
      });
    } catch {
      toast.error(t('wricefValidation.toasts.validateFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (!rejectionReason.trim()) {
      toast.error(t('wricefValidation.toasts.reasonRequired'));
      return;
    }
    setSubmitting(true);
    try {
      await WricefsAPI.rejectWricef(rejectTarget.id, rejectionReason.trim());
      toast.success(t('wricefValidation.toasts.rejected'));
      // Remove from list
      setWricefs((prev) => {
        const next = prev.filter((w) => w.id !== rejectTarget.id);
        if (selectedId === rejectTarget.id) {
          setSelectedId(next[0]?.id ?? null);
        }
        return next;
      });
      setRejectTarget(null);
      setRejectionReason('');
    } catch {
      toast.error(t('wricefValidation.toasts.rejectFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveObject = async (obj: WricefObject) => {
    try {
      await WricefObjectsAPI.approveWricefObject(obj.id);
      toast.success(t('wricefValidation.toasts.objectApproved', { title: obj.title }));
      setAllObjects((prev) =>
        prev.map((o) => (o.id === obj.id ? { ...o, status: 'VALIDATED' as const } : o)),
      );
    } catch {
      toast.error(t('wricefValidation.toasts.objectApproveFailed'));
    }
  };

  const handleRejectObject = async () => {
    if (!rejectObjTarget) return;
    if (!objRejectionReason.trim()) {
      toast.error(t('wricefValidation.toasts.reasonRequired'));
      return;
    }
    setSubmitting(true);
    try {
      await WricefObjectsAPI.rejectWricefObject(rejectObjTarget.id, objRejectionReason.trim());
      toast.success(t('wricefValidation.toasts.objectRejected', { title: rejectObjTarget.title }));
      setAllObjects((prev) =>
        prev.map((o) =>
          o.id === rejectObjTarget.id
            ? { ...o, status: 'REJECTED' as const, rejectionReason: objRejectionReason.trim() }
            : o,
        ),
      );
      setRejectObjTarget(null);
      setObjRejectionReason('');
    } catch {
      toast.error(t('wricefValidation.toasts.objectRejectFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  // ── loading ──
  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <PageHeader
        title={t('wricefValidation.title')}
        subtitle={t('wricefValidation.subtitle', { count: wricefs.length })}
        breadcrumbs={[
          { label: t('wricefValidation.breadcrumbHome'), path: '/project-manager/dashboard' },
          { label: t('wricefValidation.title') },
        ]}
      />

      {wricefs.length === 0 ? (
        <div className="p-4 sm:p-6 lg:p-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <ShieldCheck className="mb-3 h-10 w-10 text-primary/40" />
              <p className="text-sm text-muted-foreground">
                {t('wricefValidation.allReviewed')}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex h-[calc(100vh-180px)]">
          {/* ── Left panel: list ── */}
          <aside className="w-[340px] shrink-0 overflow-y-auto border-r border-border bg-surface-1 p-3">
            <div className="space-y-1.5">
              {wricefs.map((w) => {
                const isActive = w.id === selectedId;
                const objects = objectsByWricef[w.id] ?? [];
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setSelectedId(w.id)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      isActive
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-transparent hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">
                        {w.sourceFileName || t('wricefValidation.untitled')}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Badge className={`text-[9px] ${STATUS_BADGE[w.status]}`}>
                        {t('entities.wricefValidationStatus.' + w.status)}
                      </Badge>
                      <span>{projectMap.get(w.projectId)?.name ?? w.projectId}</span>
                      <span>• {t('wricefValidation.objCount', { count: objects.length })}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* ── Right panel: detail ── */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            {!selected ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {t('wricefValidation.selectFromList')}
              </div>
            ) : (
              <div className="space-y-6">
                {/* WRICEF info header */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {selected.sourceFileName || t('wricefValidation.untitledWricef')}
                        </CardTitle>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Badge className={`text-[10px] ${STATUS_BADGE[selected.status]}`}>
                            {t('entities.wricefValidationStatus.' + selected.status)}
                          </Badge>
                          <span>
                            {t('wricefValidation.projectLabel')}{' '}
                            {projectMap.get(selected.projectId)?.name ?? selected.projectId}
                          </span>
                          {selected.autoCreated && (
                            <Badge variant="secondary" className="text-[10px]">
                              {t('wricefValidation.autoCreated')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                      <div>
                        <span className="text-muted-foreground">{t('wricefValidation.imported')}</span>
                        <p className="font-medium">
                          {selected.importedAt
                            ? new Date(selected.importedAt).toLocaleDateString()
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('wricefValidation.submittedBy')}</span>
                        <p className="font-medium">
                          {selected.submittedBy
                            ? userMap.get(selected.submittedBy)?.name ?? selected.submittedBy
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('wricefValidation.submittedAt')}</span>
                        <p className="font-medium">
                          {selected.submittedAt
                            ? new Date(selected.submittedAt).toLocaleDateString()
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('wricefValidation.objects')}</span>
                        <p className="font-medium">{selectedObjects.length}</p>
                      </div>
                    </div>

                    {/* Approve / Reject buttons for the entire WRICEF */}
                    <Separator className="my-4" />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={submitting}
                        onClick={() => void handleValidate(selected)}
                      >
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                        {submitting ? t('wricefValidation.processing') : t('wricefValidation.approveWricef')}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={submitting}
                        onClick={() => {
                          setRejectionReason('');
                          setRejectTarget(selected);
                        }}
                      >
                        <XCircle className="mr-1 h-3.5 w-3.5" />
                        {t('wricefValidation.rejectWricef')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Objects list */}
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <Package className="h-4 w-4" />
                    {t('wricefValidation.objectsWithCount', { count: selectedObjects.length })}
                  </h3>

                  {selectedObjects.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center text-sm text-muted-foreground">
                        {t('wricefValidation.noObjects')}
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {selectedObjects.map((obj) => {
                        const objTickets = ticketsByObjectId[obj.id] ?? [];
                        const isPending = obj.status === 'PENDING_VALIDATION';

                        return (
                          <Card key={obj.id}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px]">
                                      {t('entities.wricefType.' + obj.type)}
                                    </Badge>
                                    <span className="text-sm font-medium">{obj.title}</span>
                                    <Badge className={`text-[10px] ${STATUS_BADGE[obj.status]}`}>
                                      {t('entities.wricefValidationStatus.' + obj.status)}
                                    </Badge>
                                  </div>

                                  {obj.description && (
                                    <p className="mt-1.5 text-xs text-muted-foreground">
                                      {obj.description}
                                    </p>
                                  )}

                                  <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-3">
                                    <div>
                                      <span className="text-muted-foreground">{t('wricefValidation.moduleLabel')} </span>
                                      <span className="font-medium">
                                        {t('entities.sapModule.' + obj.module)}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">{t('wricefValidation.complexityLabel')} </span>
                                      <span className="font-medium">
                                        {t('entities.ticketComplexity.' + obj.complexity)}
                                      </span>
                                    </div>
                                    {objTickets.length > 0 && (
                                      <div>
                                        <span className="text-muted-foreground">{t('wricefValidation.ticketsLabel')} </span>
                                        <span className="font-medium">{objTickets.length}</span>
                                      </div>
                                    )}
                                  </div>

                                  {obj.status === 'REJECTED' && obj.rejectionReason && (
                                    <div className="mt-2 flex items-start gap-1 text-xs text-red-600 dark:text-red-400">
                                      <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                                      <span>{obj.rejectionReason}</span>
                                    </div>
                                  )}

                                  {/* Tickets under this object */}
                                  {objTickets.length > 0 && (
                                    <div className="mt-3 space-y-1 rounded-md border p-2">
                                      <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                                        {t('wricefValidation.linkedTickets')}
                                      </p>
                                      {objTickets.map((t_entity) => (
                                        <div
                                          key={t_entity.id}
                                          className="flex items-center gap-2 rounded bg-muted/40 px-2 py-1 text-xs"
                                        >
                                          <Badge variant="outline" className="text-[9px]">
                                            {t_entity.ticketCode}
                                          </Badge>
                                          <span className="truncate">{t_entity.title}</span>
                                          <Badge
                                            variant="secondary"
                                            className="ml-auto text-[9px]"
                                          >
                                            {t('entities.ticketStatus.' + t_entity.status)}
                                          </Badge>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Per-object approve/reject */}
                                {isPending && (
                                  <div className="flex shrink-0 flex-col gap-1.5">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-emerald-600 hover:text-emerald-700"
                                      onClick={() => void handleApproveObject(obj)}
                                    >
                                      <CheckCircle2 className="mr-1 h-3 w-3" />
                                      {t('wricefValidation.approve')}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 hover:text-red-700"
                                      onClick={() => {
                                        setObjRejectionReason('');
                                        setRejectObjTarget(obj);
                                      }}
                                    >
                                      <XCircle className="mr-1 h-3 w-3" />
                                      {t('wricefValidation.reject')}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      {/* ── Reject WRICEF Dialog ── */}
      <Dialog
        open={rejectTarget !== null}
        onOpenChange={(open) => !open && setRejectTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('wricefValidation.rejectReasonTitle')}</DialogTitle>
            <DialogDescription>
              {rejectTarget && (
                <>{t('wricefValidation.rejectReasonDesc', { name: rejectTarget.sourceFileName })}</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="wricef-rejection-reason">{t('wricefValidation.reasonLabel')}</Label>
            <Textarea
              id="wricef-rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={t('wricefValidation.reasonPlaceholder')}
              rows={4}
              className="mt-1.5"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectTarget(null)}
              disabled={submitting}
            >
              {t('wricefValidation.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleReject()}
              disabled={submitting}
            >
              {submitting ? t('wricefValidation.rejecting') : t('wricefValidation.rejectWricef')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reject Object Dialog ── */}
      <Dialog
        open={rejectObjTarget !== null}
        onOpenChange={(open) => !open && setRejectObjTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('wricefValidation.rejectObjectTitle')}</DialogTitle>
            <DialogDescription>
              {rejectObjTarget && (
                <>{t('wricefValidation.rejectObjectDesc', { name: rejectObjTarget.title })}</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="obj-rejection-reason">{t('wricefValidation.reasonLabel')}</Label>
            <Textarea
              id="obj-rejection-reason"
              value={objRejectionReason}
              onChange={(e) => setObjRejectionReason(e.target.value)}
              placeholder={t('wricefValidation.objReasonPlaceholder')}
              rows={4}
              className="mt-1.5"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectObjTarget(null)}
              disabled={submitting}
            >
              {t('wricefValidation.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleRejectObject()}
              disabled={submitting}
            >
              {submitting ? t('wricefValidation.rejecting') : t('wricefValidation.rejectObjectTitle')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
