import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  CalendarDays,
  Download,
  FileText,
  Link2,
  UserRound,
} from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { getBaseRouteForRole } from '../../context/roleRouting';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { useAuth } from '../../context/AuthContext';import { DocumentationAPI } from '../../services/odata/documentationApi';
import { ProjectsAPI } from '../../services/odata/projectsApi';
import { TicketsAPI } from '../../services/odata/ticketsApi';
import { UsersAPI } from '../../services/odata/usersApi';
import {
  DocumentationObject,
  Ticket,
  UserRole,
  User,
  Project,
} from '../../types/entities';

const homePathByRole: Record<UserRole, string> = {
  ADMIN: '/admin/dashboard',
  MANAGER: '/manager/dashboard',
  PROJECT_MANAGER: '/project-manager/dashboard',
  DEV_COORDINATOR: '/dev-coordinator/dashboard',
  CONSULTANT_TECHNIQUE: '/consultant-tech/dashboard',
  CONSULTANT_FONCTIONNEL: '/consultant-func/dashboard',
};

const formatDate = (value?: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleString();
};

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const isDownloadableAttachment = (url: string) => !url.startsWith('blob:');

const renderMarkdown = (content: string) => {
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let unorderedItems: string[] = [];
  let orderedItems: string[] = [];
  let keyIndex = 0;

  const flushLists = () => {
    if (unorderedItems.length > 0) {
      blocks.push(
        <ul key={`ul-${keyIndex++}`} className="list-disc space-y-1 pl-5 text-sm leading-6 text-foreground">
          {unorderedItems.map((item, itemIndex) => (
            <li key={`ul-item-${itemIndex}`}>{item}</li>
          ))}
        </ul>
      );
      unorderedItems = [];
    }
    if (orderedItems.length > 0) {
      blocks.push(
        <ol key={`ol-${keyIndex++}`} className="list-decimal space-y-1 pl-5 text-sm leading-6 text-foreground">
          {orderedItems.map((item, itemIndex) => (
            <li key={`ol-item-${itemIndex}`}>{item}</li>
          ))}
        </ol>
      );
      orderedItems = [];
    }
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      flushLists();
      return;
    }

    const unorderedMatch = line.match(/^[-*]\s+(.*)$/);
    if (unorderedMatch) {
      if (orderedItems.length > 0) {
        flushLists();
      }
      unorderedItems.push(unorderedMatch[1]);
      return;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      if (unorderedItems.length > 0) {
        flushLists();
      }
      orderedItems.push(orderedMatch[1]);
      return;
    }

    flushLists();
    if (line.startsWith('### ')) {
      blocks.push(
        <h3 key={`h3-${keyIndex++}`} className="text-lg font-semibold text-foreground">
          {line.slice(4)}
        </h3>
      );
      return;
    }
    if (line.startsWith('## ')) {
      blocks.push(
        <h2 key={`h2-${keyIndex++}`} className="text-xl font-semibold text-foreground">
          {line.slice(3)}
        </h2>
      );
      return;
    }
    if (line.startsWith('# ')) {
      blocks.push(
        <h1 key={`h1-${keyIndex++}`} className="text-2xl font-semibold text-foreground">
          {line.slice(2)}
        </h1>
      );
      return;
    }

    blocks.push(
      <p key={`p-${keyIndex++}`} className="text-sm leading-7 text-foreground/95">
        {line}
      </p>
    );
  });

  flushLists();

  return blocks;
};

export const DocumentationDetails: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [documentation, setDocumentation] = useState<DocumentationObject | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      try {
        const [documentationData, ticketData, userData, projectData] = await Promise.all([
          DocumentationAPI.getById(id),
          TicketsAPI.getAll(),
          UsersAPI.getAll(),
          ProjectsAPI.getAll(),
        ]);
        setDocumentation(documentationData);
        setTickets(ticketData);
        setUsers(userData);
        setProjects(projectData);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  const roleHome = currentUser ? homePathByRole[currentUser.role] : '/dashboard';
  const authorName = documentation
    ? users.find((user) => user.id === documentation.authorId)?.name ?? documentation.authorId
    : '-';
  const projectName = documentation
    ? projects.find((project) => project.id === documentation.projectId)?.name ?? documentation.projectId
    : '-';

  const relatedTickets = useMemo(() => {
    if (!documentation) return [];
    const ticketIdSet = new Set(documentation.relatedTicketIds);
    return tickets.filter((ticket) => ticketIdSet.has(ticket.id));
  }, [documentation, tickets]);

  if (currentUser?.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={documentation ? documentation.title : t('documentation.details.title')}
        subtitle={documentation ? documentation.description : t('documentation.details.subtitle')}
        breadcrumbs={[
          { label: t('documentation.home'), path: roleHome },
          { label: t('documentation.objects') },
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t('documentation.details.back')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3 lg:p-8">
        {loading ? (
          <Card className="lg:col-span-3">
            <CardContent className="py-10 text-center text-muted-foreground">
              {t('documentation.details.loading')}
            </CardContent>
          </Card>
        ) : !documentation ? (
          <Card className="lg:col-span-3">
            <CardContent className="py-10 text-center">
              <p className="text-lg font-medium text-foreground">{t('documentation.details.notFound')}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('documentation.details.notFoundDesc')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {t(`documentation.types.${documentation.type}`)}
                  </Badge>
                  <Badge variant="secondary">
                    <Link2 className="mr-1 h-3 w-3" />
                    {documentation.relatedTicketIds.length} {t(`documentation.details.ticket${documentation.relatedTicketIds.length > 1 ? 's' : ''}`)}
                  </Badge>
                  <Badge variant="secondary">
                    <FileText className="mr-1 h-3 w-3" />
                    {documentation.attachedFiles.length} {t(`documentation.details.file${documentation.attachedFiles.length > 1 ? 's' : ''}`)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <article className="space-y-4 rounded-lg border border-border/70 bg-card p-5">
                  {renderMarkdown(documentation.content)}
                </article>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('documentation.details.metadata')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <UserRound className="h-3.5 w-3.5" />
                    <span>{t('documentation.details.author')}</span>
                    <span className="font-medium text-foreground">{authorName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>{t('documentation.details.created')}</span>
                    <span className="font-medium text-foreground">{formatDate(documentation.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>{t('documentation.details.updated')}</span>
                    <span className="font-medium text-foreground">{formatDate(documentation.updatedAt ?? documentation.createdAt)}</span>
                  </div>
                  <div className="text-muted-foreground">
                    <span>{t('documentation.details.project')}</span>
                    <span className="ml-1 font-medium text-foreground">{projectName}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('documentation.details.attachedFiles')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {documentation.attachedFiles.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('documentation.details.noFiles')}</p>
                  ) : (
                    documentation.attachedFiles.map((file, index) => (
                      <div
                        key={`${file.filename}-${index}`}
                        className="flex items-center justify-between gap-2 rounded-md border border-border/70 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{file.filename}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                        </div>
                        {isDownloadableAttachment(file.url) ? (
                          <a href={file.url} download={file.filename} target="_blank" rel="noreferrer">
                            <Button variant="outline" size="sm">
                              <Download className="mr-1 h-3.5 w-3.5" />
                              {t('documentation.details.download')}
                            </Button>
                          </a>
                        ) : (
                          <Button variant="outline" size="sm" disabled>
                            {t('documentation.details.unavailable')}
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-base">{t('documentation.details.linkedTickets')}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="px-4">{t('documentation.details.table.code')}</TableHead>
                      <TableHead className="px-4">{t('documentation.details.table.title')}</TableHead>
                      <TableHead className="px-4">{t('documentation.details.table.status')}</TableHead>
                      <TableHead className="px-4">{t('documentation.details.table.priority')}</TableHead>
                      <TableHead className="px-4">{t('documentation.details.table.project')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relatedTickets.map((ticket) => (
                      <TableRow key={ticket.id} className="cursor-pointer hover:bg-accent/40" onClick={() => navigate(`${currentUser ? getBaseRouteForRole(currentUser.role) : ''}/tickets/${ticket.id}`)}>
                        <TableCell className="px-4 py-3 font-mono text-xs">{ticket.ticketCode}</TableCell>
                        <TableCell className="px-4 py-3 font-medium">{ticket.title}</TableCell>
                        <TableCell className="px-4 py-3">{t(`tickets.status.${ticket.status}`)}</TableCell>
                        <TableCell className="px-4 py-3">{t(`tickets.priority.${ticket.priority}`)}</TableCell>
                        <TableCell className="px-4 py-3 text-muted-foreground">
                          {projects.find((project) => project.id === ticket.projectId)?.name ?? ticket.projectId}
                        </TableCell>
                      </TableRow>
                    ))}
                    {relatedTickets.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                          {t('documentation.details.noLinkedTickets')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};
