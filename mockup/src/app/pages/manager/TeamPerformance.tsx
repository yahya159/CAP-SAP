import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/common/PageHeader';
import { EvaluationsAPI, TicketsAPI, UsersAPI } from '../../services/odataClient';
import { Evaluation, Ticket, User } from '../../types/entities';
import { SkillsRadarChart } from '../../components/charts/SkillsRadarChart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export const TeamPerformance: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedConsultant, setSelectedConsultant] = useState<string>('NONE');

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [userData, ticketData, evalData] = await Promise.all([
        UsersAPI.getAll(),
        TicketsAPI.getAll(),
        EvaluationsAPI.getAll(),
      ]);
      setUsers(userData.filter((user) => user.role !== 'ADMIN' && user.role !== 'MANAGER'));
      setTickets(ticketData);
      setEvaluations(evalData);
    } catch (error) {
      setUsers([]);
      setTickets([]);
      setEvaluations([]);
      const message = error instanceof Error ? error.message : 'Failed to load team performance data.';
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getGridValue = (evaluation: Evaluation, key: keyof Evaluation['qualitativeGrid']): number => {
    const rawValue = evaluation.qualitativeGrid?.[key];
    const normalized = Number(rawValue);
    return Number.isFinite(normalized) ? normalized : 0;
  };

  const rows = useMemo(() => {
    return users.map((user) => {
      const userTickets = tickets.filter((ticket) => ticket.assignedTo === user.id);
      const done = userTickets.filter((ticket) => ticket.status === 'DONE').length;
      const blocked = userTickets.filter((ticket) => ticket.status === 'BLOCKED').length;
      const overdue = userTickets.filter(
        (ticket) =>
          ticket.status !== 'DONE' &&
          ticket.status !== 'REJECTED' &&
          Boolean(ticket.dueDate) &&
          new Date(ticket.dueDate as string) < new Date()
      ).length;

      const userEvals = evaluations.filter((evaluation) => evaluation.userId === user.id);
      const avgScore = userEvals.length
        ? userEvals.reduce((sum, evaluation) => sum + evaluation.score, 0) /
          userEvals.length
        : 0;

      const qualityScore = userEvals.length
        ? userEvals.reduce((sum, evaluation) => sum + getGridValue(evaluation, 'quality'), 0) /
          userEvals.length
        : 0;

      return {
        user,
        assigned: userTickets.length,
        done,
        blocked,
        overdue,
        avgScore,
        qualityScore,
      };
    });
  }, [evaluations, tickets, users]);

  const globalScore = rows.length
    ? rows.reduce((sum, row) => sum + row.avgScore, 0) / rows.length
    : 0;

  const workloadBalance = rows.length
    ? rows.reduce((sum, row) => sum + row.assigned, 0) / rows.length
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Team Performance"
        subtitle="Individual and collective performance by consultant"
        breadcrumbs={[
          { label: 'Home', path: '/manager/dashboard' },
          { label: 'Team Performance' },
        ]}
      />

      <div className="p-6 space-y-6">
        {loadError && (
          <Card className="border-destructive/50">
            <CardContent className="pt-4 text-sm text-destructive">{loadError}</CardContent>
          </Card>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Team Average Score</p>
              <p className="text-2xl font-semibold text-foreground mt-1">{globalScore.toFixed(2)} / 5</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Active Consultants</p>
              <p className="text-2xl font-semibold text-foreground mt-1">{rows.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Average Workload</p>
              <p className="text-2xl font-semibold text-foreground mt-1">{workloadBalance.toFixed(1)} tickets</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex-row flex-wrap items-center gap-3 pb-2 space-y-0">
            <CardTitle className="text-lg">Radar de Compétences</CardTitle>
            <Select value={selectedConsultant} onValueChange={setSelectedConsultant}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Select consultant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Select a consultant</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
          {selectedConsultant !== 'NONE' && (() => {
            const userEvals = evaluations.filter((ev) => ev.userId === selectedConsultant);
            if (!userEvals.length) {
              return <p className="text-sm text-muted-foreground">No evaluations available for this consultant.</p>;
            }
            const avg = (field: keyof Evaluation['qualitativeGrid']) =>
              userEvals.reduce((s, ev) => s + getGridValue(ev, field), 0) / userEvals.length;
            const radarData = [
              { axis: 'Productivity', value: avg('productivity'), fullMark: 5 },
              { axis: 'Quality', value: avg('quality'), fullMark: 5 },
              { axis: 'Autonomy', value: avg('autonomy'), fullMark: 5 },
              { axis: 'Collaboration', value: avg('collaboration'), fullMark: 5 },
              { axis: 'Innovation', value: avg('innovation'), fullMark: 5 },
            ];
            return <SkillsRadarChart data={radarData} />;
          })()}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">
                  Consultant
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">
                  Assigned
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">
                  Done
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">
                  Blocked
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">
                  Overdue
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">
                  Evaluation
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">
                  Quality
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">
                  Availability
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    Loading team performance...
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.user.id} className="hover:bg-accent/40">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{row.user.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{row.user.role}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{row.assigned}</td>
                    <td className="px-4 py-3 text-sm text-primary">{row.done}</td>
                    <td className="px-4 py-3 text-sm text-destructive">{row.blocked}</td>
                    <td className="px-4 py-3 text-sm text-accent-foreground">{row.overdue}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{row.avgScore.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {row.qualityScore.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {row.user.availabilityPercent}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
