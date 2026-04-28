import React, { useEffect, useState, useMemo } from 'react';
import { CheckCircle, Clock, FileText, XCircle, Search, Filter, Plus, FileUp, ExternalLink, CalendarDays } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { useAuth } from '../../context/AuthContext';import { DeliverablesAPI } from '../../services/odata/deliverablesApi';
import { NotificationsAPI } from '../../services/odata/notificationsApi';
import { ProjectsAPI } from '../../services/odata/projectsApi';
import { Deliverable, Project, UserRole, ValidationStatus } from '../../types/entities';

interface UploadForm {
  projectId: string;
  type: string;
  name: string;
  fileRef: string;
}

const EMPTY_UPLOAD_FORM: UploadForm = {
  projectId: '',
  type: 'Functional Specification',
  name: '',
  fileRef: '',
};

export const Deliverables: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const canReview = useMemo(() => {
    const role = currentUser?.role as UserRole | undefined;
    return role === 'ADMIN' || role === 'MANAGER' || role === 'PROJECT_MANAGER';
  }, [currentUser?.role]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ValidationStatus | 'ALL'>('ALL');
  
  // Dialogs & Forms
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);
  const [comment, setComment] = useState('');
  const [uploadForm, setUploadForm] = useState<UploadForm>(EMPTY_UPLOAD_FORM);
  const [isUploading, setIsUploading] = useState(false);
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);

  useEffect(() => {
    void loadDeliverables();
  }, []);

  const getStatusBadge = (status: ValidationStatus) => {
    switch (status) {
      case 'APPROVED':
        return {
          tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
          icon: CheckCircle,
          label: t('func.deliverables.approved')
        };
      case 'CHANGES_REQUESTED':
        return {
          tone: 'bg-destructive/10 text-destructive border-destructive/20',
          icon: XCircle,
          label: t('func.deliverables.changesRequested')
        };
      case 'PENDING':
        return {
          tone: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
          icon: Clock,
          label: t('func.deliverables.pendingReview')
        };
    }
  };

  const loadDeliverables = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [data, projectData] = await Promise.all([
        DeliverablesAPI.getAll(),
        ProjectsAPI.getAll(),
      ]);
      setDeliverables(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setProjects(projectData);
    } catch (error) {
      setDeliverables([]);
      setProjects([]);
      const message = error instanceof Error ? error.message : t('func.deliverables.toasts.loadFailed');
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const filteredDeliverables = useMemo(() => {
    return deliverables.filter((d) => {
      const matchStatus = statusFilter === 'ALL' || d.validationStatus === statusFilter;
      const matchSearch =
        searchQuery === '' ||
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.type.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [deliverables, statusFilter, searchQuery]);

  const closeReviewDialog = () => {
    setSelectedDeliverable(null);
    setComment('');
  };

  const updateValidationStatus = async (
    id: string,
    status: ValidationStatus,
    functionalComment?: string
  ) => {
    if (!canReview) {
      toast.error(t('func.deliverables.toasts.notAllowed'));
      return;
    }

    try {
      setIsReviewSubmitting(true);
      const updated = await DeliverablesAPI.update(id, {
        validationStatus: status,
        functionalComment,
      });
      setDeliverables((prev) => prev.map((entry) => (entry.id === id ? updated : entry)));

      const project = projects.find((entry) => entry.id === updated.projectId);
      if (project) {
        await NotificationsAPI.create({
          userId: project.managerId,
          type: 'DELIVERABLE_REVIEWED',
          title: 'Deliverable Reviewed',
          message: `"${updated.name}" moved to ${status}.`,
          read: false,
        });
      }

      toast.success(t('func.deliverables.toasts.updated'));
      closeReviewDialog();
    } catch (error) {
      toast.error(t('func.deliverables.toasts.updateFailed'));
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  const createSpecification = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUser) return;
    if (!uploadForm.projectId || !uploadForm.name.trim() || !uploadForm.type.trim()) {
      toast.error(t('func.deliverables.toasts.requiredFields'));
      return;
    }

    try {
      setIsUploading(true);
      const created = await DeliverablesAPI.create({
        projectId: uploadForm.projectId,
        type: uploadForm.type.trim(),
        name: uploadForm.name.trim(),
        fileRef: uploadForm.fileRef.trim() || undefined,
        validationStatus: 'PENDING',
        functionalComment: '',
      });
      setDeliverables((prev) => [created, ...prev]);

      const project = projects.find((entry) => entry.id === uploadForm.projectId);
      if (project) {
        await NotificationsAPI.create({
          userId: project.managerId,
          type: 'DELIVERABLE_SUBMITTED',
          title: 'New Functional Specification',
          message: `${currentUser.name} submitted "${created.name}" for review.`,
          read: false,
        });
      }

      setUploadForm(EMPTY_UPLOAD_FORM);
      setIsDepositOpen(false);
      toast.success(t('func.deliverables.toasts.submitted'));
    } catch (error) {
      toast.error(t('func.deliverables.toasts.submitFailed'));
    } finally {
      setIsUploading(false);
    }
  };

  // Metrics
  const pendingCount = deliverables.filter(d => d.validationStatus === 'PENDING').length;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={t('func.deliverables.title')}
        subtitle={t('func.deliverables.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/consultant-func/dashboard' },
          { label: t('func.deliverables.title') },
        ]}
      />

      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {loadError && (
          <Card className="border-destructive/50">
            <CardContent className="pt-4 text-sm text-destructive">{loadError}</CardContent>
          </Card>
        )}
        
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
          <div className="flex flex-1 gap-4 items-center w-full sm:w-auto">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('func.deliverables.search')}
                className="pl-9 bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
               <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
               <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ValidationStatus | 'ALL')}>
                 <SelectTrigger className="w-[180px] bg-background">
                   <SelectValue placeholder={t('func.deliverables.allStatuses')} />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="ALL">{t('func.deliverables.allStatuses')}</SelectItem>
                   <SelectItem value="PENDING">{t('func.deliverables.pendingReview')}</SelectItem>
                   <SelectItem value="APPROVED">{t('func.deliverables.approved')}</SelectItem>
                   <SelectItem value="CHANGES_REQUESTED">{t('func.deliverables.changesRequested')}</SelectItem>
                 </SelectContent>
               </Select>
            </div>
          </div>
          <Button onClick={() => setIsDepositOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> {t('func.deliverables.deposit')}
          </Button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredDeliverables.length === 0 ? (
          <Card className="bg-card/50 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-primary/60" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">{t('func.deliverables.empty.title')}</h3>
              <p className="mt-2 text-muted-foreground max-w-sm">
                {searchQuery ? t('func.deliverables.empty.descSearch') : t('func.deliverables.empty.descEmpty')}
              </p>
              {!searchQuery && statusFilter === 'ALL' && (
                <Button onClick={() => setIsDepositOpen(true)} variant="outline" className="mt-6">
                  <FileUp className="mr-2 h-4 w-4" /> {t('func.deliverables.empty.upload')}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
             {pendingCount > 0 && statusFilter === 'ALL' && !searchQuery && (
                <h3 className="text-sm font-medium text-muted-foreground flex items-center mb-2">
                  <span className="flex h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
                  {t('func.deliverables.waitingReview', { count: pendingCount })}
                </h3>
             )}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredDeliverables.map((deliverable) => {
                const badge = getStatusBadge(deliverable.validationStatus);
                const StatusIcon = badge.icon;
                const project = projects.find((p) => p.id === deliverable.projectId);
                
                return (
                  <Card key={deliverable.id} className="flex flex-col hover:border-primary/50 transition-colors shadow-sm bg-card overflow-hidden">
                    <div className="h-2 w-full bg-gradient-to-r from-primary/20 to-transparent" />
                    <CardHeader className="pb-3 border-b border-border/50">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className={`font-medium shadow-none ${badge.tone}`}>
                          <StatusIcon className="mr-1.5 h-3 w-3" />
                          {badge.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center">
                          <CalendarDays className="h-3 w-3 mr-1" />
                          {new Date(deliverable.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                        {deliverable.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1.5 mt-1.5 text-xs font-medium text-foreground/70">
                        {deliverable.type}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="py-4 flex-1">
                      <div className="space-y-3">
                        <div className="flex flex-col">
                           <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">{t('func.deliverables.project')}</span>
                           <span className="text-sm text-foreground">{project?.name ?? deliverable.projectId}</span>
                        </div>
                        
                        {deliverable.fileRef && (
                           <div className="flex flex-col">
                             <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">{t('func.deliverables.reference')}</span>
                             <a href="#" className="text-sm text-blue-500 hover:underline flex items-center truncate">
                                <ExternalLink className="h-3 w-3 mr-1 flex-shrink-0" />
                                <span className="truncate">{deliverable.fileRef}</span>
                             </a>
                           </div>
                        )}

                        {deliverable.functionalComment && (
                          <div className="mt-4 rounded-lg border border-border bg-muted/40 p-3">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">{t('func.deliverables.feedback')}</span>
                            <p className="text-sm text-foreground/80 line-clamp-3">{deliverable.functionalComment}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    
                    {canReview && deliverable.validationStatus === 'PENDING' && (
                      <CardFooter className="pt-3 border-t border-border/50 bg-muted/10">
                        <Button
                          variant="default"
                          className="w-full shadow-sm"
                          onClick={() => {
                            setSelectedDeliverable(deliverable);
                            setComment(deliverable.functionalComment || '');
                          }}
                        >
                          {t('func.deliverables.review')}
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Deposit Dialog */}
      <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5 text-primary" />
              {t('func.deliverables.depositDialog.title')}
            </DialogTitle>
            <DialogDescription>
              {t('func.deliverables.depositDialog.desc')}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={createSpecification} id="deposit-form" className="space-y-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="deliverable-project" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('func.deliverables.depositDialog.targetProject')}</Label>
              <Select
                value={uploadForm.projectId}
                onValueChange={(value) => setUploadForm((prev) => ({ ...prev, projectId: value }))}
              >
                <SelectTrigger id="deliverable-project" className="h-11">
                  <SelectValue placeholder={t('func.deliverables.depositDialog.projectPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deliverable-type" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('func.deliverables.depositDialog.docType')}</Label>
                <Input
                  id="deliverable-type"
                  value={uploadForm.type}
                  className="h-11"
                  onChange={(event) => setUploadForm((prev) => ({ ...prev, type: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliverable-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('func.deliverables.depositDialog.docTitle')}</Label>
                <Input
                  id="deliverable-name"
                  value={uploadForm.name}
                  className="h-11"
                  onChange={(event) => setUploadForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder={t('func.deliverables.depositDialog.docTitlePlaceholder')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliverable-file-ref" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('func.deliverables.depositDialog.fileRef')}</Label>
              <Input
                id="deliverable-file-ref"
                value={uploadForm.fileRef}
                className="h-11"
                onChange={(event) =>
                  setUploadForm((prev) => ({ ...prev, fileRef: event.target.value }))
                }
                placeholder={t('func.deliverables.depositDialog.fileRefPlaceholder')}
              />
            </div>
          </form>

          <DialogFooter className="pt-4 border-t border-border/50">
             <Button type="button" variant="ghost" onClick={() => setIsDepositOpen(false)}>{t('common.cancel')}</Button>
             <Button type="submit" form="deposit-form" disabled={isUploading || !uploadForm.projectId || !uploadForm.name}>
               {isUploading ? t('func.deliverables.depositDialog.submitting') : t('func.deliverables.depositDialog.submit')}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={canReview && selectedDeliverable !== null} onOpenChange={(open) => !open && closeReviewDialog()}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('func.deliverables.reviewDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('func.deliverables.reviewDialog.desc')}
            </DialogDescription>
          </DialogHeader>

          {selectedDeliverable && (
            <div className="space-y-5 py-4">
              <div className="grid grid-cols-2 gap-4 bg-muted/40 p-4 rounded-xl border border-border">
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1 block">{t('func.deliverables.reviewDialog.name')}</Label>
                  <div className="text-sm font-medium">{selectedDeliverable.name}</div>
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1 block">{t('func.deliverables.reviewDialog.type')}</Label>
                  <div className="text-sm font-medium">{selectedDeliverable.type}</div>
                </div>
                {selectedDeliverable.fileRef && (
                   <div className="col-span-2">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1 block">{t('func.deliverables.reviewDialog.link')}</Label>
                      <a href="#" className="text-sm text-blue-500 hover:underline">{selectedDeliverable.fileRef}</a>
                   </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="review-comment" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('func.deliverables.reviewDialog.feedbackLabel')}</Label>
                <Textarea
                  id="review-comment"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  rows={4}
                  className="resize-none"
                  placeholder={t('func.deliverables.reviewDialog.feedbackPlaceholder')}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between pt-4 border-t border-border/50">
            <Button type="button" variant="ghost" onClick={closeReviewDialog} className="sm:mr-auto">
              {t('common.cancel')}
            </Button>
            <div className="flex flex-col sm:flex-row gap-2">
               <Button
                 type="button"
                 variant="destructive"
                 disabled={!selectedDeliverable || isReviewSubmitting}
                 onClick={() =>
                   selectedDeliverable &&
                   void updateValidationStatus(selectedDeliverable.id, 'CHANGES_REQUESTED', comment)
                 }
               >
                 <XCircle className="h-4 w-4 mr-1.5" />
                 {isReviewSubmitting ? t('func.deliverables.reviewDialog.saving') : t('func.deliverables.reviewDialog.requestChanges')}
               </Button>
               <Button
                 type="button"
                 disabled={!selectedDeliverable || isReviewSubmitting}
                 className="bg-emerald-600 hover:bg-emerald-700 text-white"
                 onClick={() =>
                   selectedDeliverable &&
                   void updateValidationStatus(selectedDeliverable.id, 'APPROVED', comment)
                 }
               >
                 <CheckCircle className="h-4 w-4 mr-1.5" />
                 {isReviewSubmitting ? t('func.deliverables.reviewDialog.saving') : t('func.deliverables.reviewDialog.approve')}
               </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
