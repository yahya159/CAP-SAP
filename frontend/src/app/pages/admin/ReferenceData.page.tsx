import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/common/PageHeader';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { ReferenceDataAPI } from '../../services/odata/referenceDataApi';
import { ReferenceData } from '../../types/entities';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

type ReferenceType = ReferenceData['type'] | 'ALL';

const EMPTY_FORM: Omit<ReferenceData, 'id'> = {
  type: 'TICKET_STATUS',
  code: '',
  label: '',
  active: true,
  order: 1,
};

export const ReferenceDataManagement: React.FC = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<ReferenceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<ReferenceType>('ALL');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<Omit<ReferenceData, 'id'>>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemPendingDelete, setItemPendingDelete] = useState<ReferenceData | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await ReferenceDataAPI.getAll();
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        const matchesType = typeFilter === 'ALL' || item.type === typeFilter;
        const query = search.trim().toLowerCase();
        if (!query) return matchesType;
        return (
          matchesType &&
          (item.code.toLowerCase().includes(query) || item.label.toLowerCase().includes(query))
        );
      })
      .sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        if ((a.order ?? 0) !== (b.order ?? 0)) return (a.order ?? 0) - (b.order ?? 0);
        return a.label.localeCompare(b.label);
      });
  }, [items, search, typeFilter]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const getTypeLabel = (type: ReferenceData['type']) => {
    switch (type) {
      case 'TICKET_STATUS':
        return t('admin.referenceData.types.ticketStatus');
      case 'PRIORITY':
        return t('admin.referenceData.types.priority');
      case 'PROJECT_TYPE':
        return t('admin.referenceData.types.projectType');
      case 'SKILL':
        return t('admin.referenceData.types.skill');
      default:
        return type;
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.code.trim() || !form.label.trim()) {
      toast.error(t('admin.referenceData.toasts.addFailed'));
      return;
    }
    if ((form.order ?? 1) < 1) {
      toast.error(t('admin.referenceData.toasts.orderMin'));
      return;
    }

    const normalizedCode = form.code.trim().toUpperCase();
    const duplicate = items.find(
      (item) =>
        item.type === form.type &&
        item.code.toUpperCase() === normalizedCode &&
        item.id !== editingId
    );
    if (duplicate) {
      toast.error(t('admin.referenceData.toasts.duplicateCode'));
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingId) {
        const updated = await ReferenceDataAPI.update(editingId, {
          ...form,
          code: normalizedCode,
          label: form.label.trim(),
        });
        setItems((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
        toast.success(t('admin.referenceData.toasts.updateSuccess'));
      } else {
        const created = await ReferenceDataAPI.create({
          ...form,
          code: normalizedCode,
          label: form.label.trim(),
        });
        setItems((prev) => [created, ...prev]);
        toast.success(t('admin.referenceData.toasts.createSuccess'));
      }
      resetForm();
    } catch (error) {
      toast.error(t('admin.referenceData.toasts.saveFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (item: ReferenceData) => {
    setEditingId(item.id);
    setForm({
      type: item.type,
      code: item.code,
      label: item.label,
      active: item.active,
      order: item.order ?? 1,
    });
  };

  const toggleActive = async (item: ReferenceData) => {
    try {
      const updated = await ReferenceDataAPI.update(item.id, { active: !item.active });
      setItems((prev) => prev.map((entry) => (entry.id === item.id ? updated : entry)));
    } catch (error) {
      toast.error(t('admin.referenceData.toasts.statusUpdateFailed'));
    }
  };

  const removeItem = async (id: string) => {
    try {
      await ReferenceDataAPI.delete(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success(t('admin.referenceData.toasts.deleteSuccess'));
      if (editingId === id) {
        resetForm();
      }
    } catch (error) {
      toast.error(t('admin.referenceData.toasts.deleteFailed'));
    } finally {
      setItemPendingDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={t('admin.referenceData.title')}
        subtitle={t('admin.referenceData.pageSubtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/admin/dashboard' },
          { label: t('admin.referenceData.breadcrumb') },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 p-6 xl:grid-cols-3 lg:p-8">
        <Card className="h-fit bg-card/92 xl:col-span-1">
          <CardContent className="pt-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              {editingId
                ? t('admin.referenceData.form.editTitle')
                : t('admin.referenceData.form.createTitle')}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="reference-type">{t('admin.referenceData.type')}</Label>
                <Select
                  value={form.type}
                  onValueChange={(val) =>
                    setForm((prev) => ({
                      ...prev,
                      type: val as ReferenceData['type'],
                    }))
                  }
                >
                  <SelectTrigger id="reference-type">
                    <SelectValue placeholder={t('admin.referenceData.form.typePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TICKET_STATUS">
                      {t('admin.referenceData.types.ticketStatus')}
                    </SelectItem>
                    <SelectItem value="PRIORITY">
                      {t('admin.referenceData.types.priority')}
                    </SelectItem>
                    <SelectItem value="PROJECT_TYPE">
                      {t('admin.referenceData.types.projectType')}
                    </SelectItem>
                    <SelectItem value="SKILL">{t('admin.referenceData.types.skill')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reference-code">{t('admin.referenceData.code')}</Label>
                <Input
                  id="reference-code"
                  value={form.code}
                  onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
                  placeholder={t('admin.referenceData.form.codePlaceholder')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reference-label">{t('admin.referenceData.label')}</Label>
                <Input
                  id="reference-label"
                  value={form.label}
                  onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))}
                  placeholder={t('admin.referenceData.form.labelPlaceholder')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reference-order">{t('admin.referenceData.order')}</Label>
                <Input
                  id="reference-order"
                  type="number"
                  min={1}
                  value={form.order ?? 1}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, order: Number(event.target.value || 1) }))
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-md border border-border/70 bg-surface-2 p-3">
                <Label htmlFor="reference-active">{t('admin.referenceData.active')}</Label>
                <Switch
                  id="reference-active"
                  checked={form.active}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({ ...prev, active: Boolean(checked) }))
                  }
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {isSubmitting
                    ? t('admin.referenceData.form.saving')
                    : editingId
                      ? t('admin.referenceData.form.update')
                      : t('admin.referenceData.form.create')}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    <X className="h-4 w-4" />
                    {t('admin.referenceData.cancel')}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-card/92 xl:col-span-2">
          <CardContent className="p-0">
            <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row">
              <div className="space-y-1 md:flex-1">
                <Label htmlFor="reference-search" className="sr-only">
                  {t('admin.referenceData.filters.searchLabel')}
                </Label>
                <Input
                  id="reference-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t('admin.referenceData.search')}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="reference-type-filter" className="sr-only">
                  {t('admin.referenceData.filters.typeLabel')}
                </Label>
                <Select
                  value={typeFilter}
                  onValueChange={(val) => setTypeFilter(val as ReferenceType)}
                >
                  <SelectTrigger id="reference-type-filter" className="w-full md:w-[220px]">
                    <SelectValue placeholder={t('admin.referenceData.filters.allTypes')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">
                      {t('admin.referenceData.filters.allTypes')}
                    </SelectItem>
                    <SelectItem value="TICKET_STATUS">
                      {t('admin.referenceData.types.ticketStatus')}
                    </SelectItem>
                    <SelectItem value="PRIORITY">
                      {t('admin.referenceData.types.priority')}
                    </SelectItem>
                    <SelectItem value="PROJECT_TYPE">
                      {t('admin.referenceData.types.projectType')}
                    </SelectItem>
                    <SelectItem value="SKILL">{t('admin.referenceData.types.skill')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Table>
              <TableHeader className="bg-muted/65">
                <TableRow>
                  <TableHead className="px-4">{t('admin.referenceData.table.type')}</TableHead>
                  <TableHead className="px-4">{t('admin.referenceData.table.code')}</TableHead>
                  <TableHead className="px-4">{t('admin.referenceData.table.label')}</TableHead>
                  <TableHead className="px-4">{t('admin.referenceData.table.order')}</TableHead>
                  <TableHead className="px-4">{t('admin.referenceData.table.status')}</TableHead>
                  <TableHead className="px-4 text-right">
                    {t('admin.referenceData.table.actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      {t('admin.referenceData.table.loading')}
                    </TableCell>
                  </TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      {t('admin.referenceData.table.empty')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-accent/40">
                      <TableCell className="px-4 py-3 text-sm">{getTypeLabel(item.type)}</TableCell>
                      <TableCell className="px-4 py-3 text-sm font-mono">{item.code}</TableCell>
                      <TableCell className="px-4 py-3 text-sm">{item.label}</TableCell>
                      <TableCell className="px-4 py-3 text-sm">{item.order ?? '-'}</TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`reference-active-${item.id}`}
                            checked={item.active}
                            aria-label={t('admin.referenceData.table.toggleActive', {
                              label: item.label,
                            })}
                            onCheckedChange={() => void toggleActive(item)}
                          />
                          <Badge variant="secondary">
                            {item.active
                              ? t('admin.referenceData.status.active')
                              : t('admin.referenceData.status.inactive')}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEdit(item)}
                            aria-label={t('admin.referenceData.edit', { label: item.label })}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">
                              {t('admin.referenceData.edit', { label: item.label })}
                            </span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setItemPendingDelete(item)}
                            aria-label={t('admin.referenceData.deleteItem', {
                              label: item.label,
                            })}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={itemPendingDelete !== null} onOpenChange={(open) => !open && setItemPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.referenceData.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {itemPendingDelete
                ? t('admin.referenceData.deleteDescWithCode', {
                    label: itemPendingDelete.label,
                    code: itemPendingDelete.code,
                  })
                : t('admin.referenceData.deleteDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.referenceData.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => itemPendingDelete && void removeItem(itemPendingDelete.id)}
            >
              {t('admin.referenceData.yes')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
