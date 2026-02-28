import React, { useEffect, useState, useMemo } from 'react';
import { CheckCircle, Clock, FileText, XCircle, Search, Filter, Plus, FileUp, ExternalLink, CalendarDays } from 'lucide-react';
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
import { useAuth } from '../../context/AuthContext';
import { DeliverablesAPI, NotificationsAPI, ProjectsAPI } from '../../services/odataClient';
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

const getStatusBadge = (status: ValidationStatus) => {
  switch (status) {
    case 'APPROVED':
      return {
        tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
        icon: CheckCircle,
        label: 'Approved'
      };
    case 'CHANGES_REQUESTED':
      return {
        tone: 'bg-destructive/10 text-destructive border-destructive/20',
        icon: XCircle,
        label: 'Changes Requested'
      };
    case 'PENDING':
      return {
        tone: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
        icon: Clock,
        label: 'Pending Review'
      };
  }
};

export const Deliverables: React.FC = () => {
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
      const message = error instanceof Error ? error.message : 'Failed to load deliverables.';
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
      toast.error('You are not allowed to review deliverables');
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

      toast.success('Deliverable status updated');
      closeReviewDialog();
    } catch (error) {
      toast.error('Failed to update deliverable');
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  const createSpecification = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUser) return;
    if (!uploadForm.projectId || !uploadForm.name.trim() || !uploadForm.type.trim()) {
      toast.error('Project, name and type are required');
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
      toast.success('Specification submitted successfully');
    } catch (error) {
      toast.error('Failed to submit specification');
    } finally {
      setIsUploading(false);
    }
  };

  // Metrics
  const pendingCount = deliverables.filter(d => d.validationStatus === 'PENDING').length;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Deliverables & Specifications"
        subtitle="Manage, review, and validate project deliverables"
        breadcrumbs={[
          { label: 'Home', path: '/consultant-func/dashboard' },
          { label: 'Deliverables' },
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
                placeholder="Search deliverables..."
                className="pl-9 bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
               <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
               <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                 <SelectTrigger className="w-[180px] bg-background">
                   <SelectValue placeholder="All Statuses" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="ALL">All Statuses</SelectItem>
                   <SelectItem value="PENDING">Pending Review</SelectItem>
                   <SelectItem value="APPROVED">Approved</SelectItem>
                   <SelectItem value="CHANGES_REQUESTED">Changes Requested</SelectItem>
                 </SelectContent>
               </Select>
            </div>
          </div>
          <Button onClick={() => setIsDepositOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Deposit Deliverable
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
              <h3 className="text-xl font-semibold text-foreground">No deliverables found</h3>
              <p className="mt-2 text-muted-foreground max-w-sm">
                {searchQuery ? 'Try adjusting your search or filters.' : 'There are no deliverables uploaded yet. Click the button above to deposit your first functional specification.'}
              </p>
              {!searchQuery && statusFilter === 'ALL' && (
                <Button onClick={() => setIsDepositOpen(true)} variant="outline" className="mt-6">
                  <FileUp className="mr-2 h-4 w-4" /> Upload Document
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
             {pendingCount > 0 && statusFilter === 'ALL' && !searchQuery && (
                <h3 className="text-sm font-medium text-muted-foreground flex items-center mb-2">
                  <span className="flex h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
                  {pendingCount} waiting for review
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
                           <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Project</span>
                           <span className="text-sm text-foreground">{project?.name ?? deliverable.projectId}</span>
                        </div>
                        
                        {deliverable.fileRef && (
                           <div className="flex flex-col">
                             <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Reference</span>
                             <a href="#" className="text-sm text-blue-500 hover:underline flex items-center truncate">
                                <ExternalLink className="h-3 w-3 mr-1 flex-shrink-0" />
                                <span className="truncate">{deliverable.fileRef}</span>
                             </a>
                           </div>
                        )}

                        {deliverable.functionalComment && (
                          <div className="mt-4 rounded-lg border border-border bg-muted/40 p-3">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">Feedback</span>
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
                          Review Deliverable
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
              Deposit Deliverable
            </DialogTitle>
            <DialogDescription>
              Submit a new functional specification or project deliverable for validation.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={createSpecification} id="deposit-form" className="space-y-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="deliverable-project" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target Project</Label>
              <Select
                value={uploadForm.projectId}
                onValueChange={(value) => setUploadForm((prev) => ({ ...prev, projectId: value }))}
              >
                <SelectTrigger id="deliverable-project" className="h-11">
                  <SelectValue placeholder="Select the associated project..." />
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
                <Label htmlFor="deliverable-type" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Document Type</Label>
                <Input
                  id="deliverable-type"
                  value={uploadForm.type}
                  className="h-11"
                  onChange={(event) => setUploadForm((prev) => ({ ...prev, type: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliverable-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title</Label>
                <Input
                  id="deliverable-name"
                  value={uploadForm.name}
                  className="h-11"
                  onChange={(event) => setUploadForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="e.g. Scope Def v1.2"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliverable-file-ref" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">File Link / Reference (Optional)</Label>
              <Input
                id="deliverable-file-ref"
                value={uploadForm.fileRef}
                className="h-11"
                onChange={(event) =>
                  setUploadForm((prev) => ({ ...prev, fileRef: event.target.value }))
                }
                placeholder="https://sharepoint.com/..."
              />
            </div>
          </form>

          <DialogFooter className="pt-4 border-t border-border/50">
             <Button type="button" variant="ghost" onClick={() => setIsDepositOpen(false)}>Cancel</Button>
             <Button type="submit" form="deposit-form" disabled={isUploading || !uploadForm.projectId || !uploadForm.name}>
               {isUploading ? 'Submitting...' : 'Submit Deliverable'}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={canReview && selectedDeliverable !== null} onOpenChange={(open) => !open && closeReviewDialog()}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Review Deliverable</DialogTitle>
            <DialogDescription>
              Validate the specification and provide actionable feedback if changes are needed.
            </DialogDescription>
          </DialogHeader>

          {selectedDeliverable && (
            <div className="space-y-5 py-4">
              <div className="grid grid-cols-2 gap-4 bg-muted/40 p-4 rounded-xl border border-border">
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1 block">Name</Label>
                  <div className="text-sm font-medium">{selectedDeliverable.name}</div>
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1 block">Type</Label>
                  <div className="text-sm font-medium">{selectedDeliverable.type}</div>
                </div>
                {selectedDeliverable.fileRef && (
                   <div className="col-span-2">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1 block">Link</Label>
                      <a href="#" className="text-sm text-blue-500 hover:underline">{selectedDeliverable.fileRef}</a>
                   </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="review-comment" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Validation Notes / Feedback</Label>
                <Textarea
                  id="review-comment"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  rows={4}
                  className="resize-none"
                  placeholder="Provide any feedback for the author..."
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between pt-4 border-t border-border/50">
            <Button type="button" variant="ghost" onClick={closeReviewDialog} className="sm:mr-auto">
              Cancel
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
                 {isReviewSubmitting ? 'Saving...' : 'Request Changes'}
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
                 {isReviewSubmitting ? 'Saving...' : 'Approve'}
               </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
