import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/common/PageHeader';
import { UsersAPI } from '../../services/odata/usersApi';
import { Certification, CertificationStatus, User } from '../../types/entities';
import { Award } from 'lucide-react';
import { Input } from '../../components/ui/input';
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

const statusColor: Record<CertificationStatus, string> = {
  VALID: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  EXPIRING_SOON: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  EXPIRED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export const CertifiedConsultants: React.FC = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CertificationStatus | 'ALL'>('ALL');

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await UsersAPI.getAll();
      setUsers(data.filter((u) => u.role !== 'ADMIN' && u.role !== 'MANAGER'));
    } finally {
      setLoading(false);
    }
  };

  const rows = useMemo(() => {
    const q = search.toLowerCase();
    const items: {
      user: User;
      certName: string;
      issuingBody: string;
      dateObtained: string;
      expiryDate?: string;
      status: CertificationStatus;
    }[] = [];

    users.forEach((user) => {
      (user.certifications ?? []).forEach((raw) => {
        // Guard against stale localStorage where certs were plain strings
        if (typeof raw !== 'object' || raw === null || !('id' in raw)) return;
        const cert = raw as Certification;
        if (statusFilter !== 'ALL' && cert.status !== statusFilter) return;
        if (
          q &&
          !cert.name.toLowerCase().includes(q) &&
          !user.name.toLowerCase().includes(q) &&
          !cert.issuingBody.toLowerCase().includes(q)
        )
          return;
        items.push({
          user,
          certName: cert.name,
          issuingBody: cert.issuingBody,
          dateObtained: cert.dateObtained,
          expiryDate: cert.expiryDate,
          status: cert.status,
        });
      });
    });

    return items;
  }, [users, search, statusFilter]);

  const certCount = rows.length;
  const validCount = rows.filter((r) => r.status === 'VALID').length;
  const expiringCount = rows.filter((r) => r.status === 'EXPIRING_SOON').length;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={t('dashboard.certifications.title')}
        subtitle={t('dashboard.certifications.subtitle')}
        breadcrumbs={[
          { label: t('documentation.home'), path: '/manager/dashboard' },
          { label: t('dashboard.certifications.title') },
        ]}
      />

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-semibold text-primary">{certCount}</div>
            <div className="text-xs text-muted-foreground">
              {t('dashboard.certifications.stats.total')}
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-semibold text-green-600">{validCount}</div>
            <div className="text-xs text-muted-foreground">
              {t('dashboard.certifications.stats.valid')}
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-semibold text-yellow-600">{expiringCount}</div>
            <div className="text-xs text-muted-foreground">
              {t('dashboard.certifications.stats.expiring')}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Input
            placeholder={t('dashboard.certifications.filters.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder={t('dashboard.leaves.filters.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t('dashboard.certifications.filters.allStatuses')}</SelectItem>
              <SelectItem value="VALID">{t('entities.certificationStatus.VALID')}</SelectItem>
              <SelectItem value="EXPIRING_SOON">
                {t('entities.certificationStatus.EXPIRING_SOON')}
              </SelectItem>
              <SelectItem value="EXPIRED">{t('entities.certificationStatus.EXPIRED')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-muted-foreground">{t('documentation.loading')}</p>
        ) : (
          <div className="rounded-lg border bg-card overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="px-4">
                    {t('dashboard.certifications.table.consultant')}
                  </TableHead>
                  <TableHead className="px-4">
                    {t('dashboard.certifications.table.certification')}
                  </TableHead>
                  <TableHead className="px-4">
                    {t('dashboard.certifications.table.issuingBody')}
                  </TableHead>
                  <TableHead className="px-4">
                    {t('dashboard.certifications.table.obtained')}
                  </TableHead>
                  <TableHead className="px-4">{t('dashboard.certifications.table.expires')}</TableHead>
                  <TableHead className="px-4">{t('dashboard.leaves.filters.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, i) => (
                  <TableRow key={`${row.user.id}-${row.certName}-${i}`}>
                    <TableCell className="px-4 py-3 font-medium">{row.user.name}</TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" />
                        {row.certName}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                      {row.issuingBody}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      {new Date(row.dateObtained).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      {row.expiryDate ? new Date(row.expiryDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge className={statusColor[row.status]}>
                        {t(`entities.certificationStatus.${row.status}`)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      {t('dashboard.certifications.table.noCerts')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};
