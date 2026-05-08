'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  ClockIcon,
  FunnelIcon,
  TrophyIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const statusLabels: Record<string, string> = {
  in_progress: 'En curso',
  pending: 'Pendiente',
  completed: 'Finalizada',
  cancelled: 'Cancelada',
};

const resultLabels: Record<string, string> = {
  all: 'Todos',
  win: 'Victorias',
  loss: 'Derrotas',
  draw: 'Empates',
};

function getUserTeamIndex(match: any, userId?: string) {
  if (!userId) return -1;
  return match.teams?.findIndex((team: any) =>
    team.players?.some((player: any) => (player.user?._id || player.user) === userId)
  );
}

function getUserResult(match: any, userId?: string) {
  if (match.status !== 'completed') return 'En curso';
  if (match.winner === undefined || match.winner === null) return 'Empate';
  const teamIndex = getUserTeamIndex(match, userId);
  if (teamIndex === -1) return '-';
  return teamIndex === match.winner ? 'Victoria' : 'Derrota';
}

export default function MatchesPage() {
  const [filters, setFilters] = useState({
    groupId: '',
    status: '',
    gameType: '',
    result: 'all',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get('status');
    if (status) {
      setFilters((current) => ({ ...current, status }));
    }
  }, []);

  const queryParams = useMemo(() => {
    return Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value && value !== 'all')
    );
  }, [filters]);

  const { data: matchesResponse, isLoading } = useQuery({
    queryKey: ['matches', queryParams],
    queryFn: () => apiClient.getMatches(queryParams),
  });

  const { data: summaryResponse } = useQuery({
    queryKey: ['matches-summary'],
    queryFn: () => apiClient.getMatchSummary(),
  });

  const { data: groupsResponse } = useQuery({
    queryKey: ['groups', 'matches-filter'],
    queryFn: () => apiClient.getGroups({ filter: 'joined' }),
  });

  const matches = matchesResponse?.data || [];
  const groups = groupsResponse?.data || [];
  const summary = summaryResponse?.data || { total: 0, active: 0, completed: 0, wins: 0, losses: 0, draws: 0 };
  const activeMatches = matches.filter((match: any) => match.status !== 'completed');
  const completedMatches = matches.filter((match: any) => match.status === 'completed');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-10 w-2 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.6)]" />
            <h1 className="text-4xl sm:text-6xl font-black text-zinc-50 italic tracking-tighter uppercase leading-none">
              Partidas
            </h1>
          </div>
          <p className="text-zinc-500 max-w-2xl">
            Seguimiento de partidas activas, resultados recientes e historial competitivo de todos tus grupos.
          </p>
        </div>
        <Link href="/groups">
          <Button className="h-12 bg-blue-600 hover:bg-blue-500 font-black uppercase italic">
            Organizar desde un grupo
            <ArrowRightIcon className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          ['Total', summary.total],
          ['En curso', summary.active],
          ['Finalizadas', summary.completed],
          ['Victorias', summary.wins],
          ['Derrotas', summary.losses],
          ['Empates', summary.draws],
        ].map(([label, value]) => (
          <Card key={label} className="bg-zinc-900/60 border-zinc-800">
            <CardContent className="p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">{label}</p>
              <p className="text-3xl font-black italic text-zinc-100 mt-2">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <FunnelIcon className="w-5 h-5 text-blue-500" />
            Filtros
          </CardTitle>
          <CardDescription>Filtrá por grupo, juego, resultado, estado o fecha.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <select
            value={filters.groupId}
            onChange={(event) => setFilters({ ...filters, groupId: event.target.value })}
            className="h-12 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-zinc-100"
          >
            <option value="">Todos los grupos</option>
            {groups.map((group: any) => (
              <option key={group._id} value={group._id}>{group.name}</option>
            ))}
          </select>
          <Input
            placeholder="Juego"
            value={filters.gameType}
            onChange={(event) => setFilters({ ...filters, gameType: event.target.value })}
          />
          <select
            value={filters.status}
            onChange={(event) => setFilters({ ...filters, status: event.target.value })}
            className="h-12 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-zinc-100"
          >
            <option value="">Todos los estados</option>
            <option value="in_progress">En curso</option>
            <option value="completed">Finalizadas</option>
            <option value="pending">Pendientes</option>
          </select>
          <select
            value={filters.result}
            onChange={(event) => setFilters({ ...filters, result: event.target.value })}
            className="h-12 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-zinc-100"
          >
            {Object.entries(resultLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(event) => setFilters({ ...filters, dateFrom: event.target.value })}
          />
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(event) => setFilters({ ...filters, dateTo: event.target.value })}
          />
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <ClockIcon className="w-5 h-5 text-blue-500" />
          <h2 className="text-2xl font-black italic uppercase text-zinc-50">Activas / En curso</h2>
        </div>
        <MatchGrid matches={activeMatches} isLoading={isLoading} emptyText="No hay partidas activas." active />
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <CalendarDaysIcon className="w-5 h-5 text-emerald-500" />
          <h2 className="text-2xl font-black italic uppercase text-zinc-50">Completadas recientemente</h2>
        </div>
        <MatchGrid matches={completedMatches} isLoading={isLoading} emptyText="No hay partidas completadas con estos filtros." />
      </section>
    </div>
  );
}

function MatchGrid({ matches, isLoading, emptyText, active = false }: {
  matches: any[];
  isLoading: boolean;
  emptyText: string;
  active?: boolean;
}) {
  if (isLoading) {
    return <div className="text-zinc-500 py-8">Cargando partidas...</div>;
  }

  if (matches.length === 0) {
    return (
      <div className="border border-dashed border-zinc-800 rounded-2xl p-10 text-center text-zinc-500">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {matches.map((match) => (
        <MatchCard key={match._id} match={match} active={active} />
      ))}
    </div>
  );
}

function MatchCard({ match, active }: { match: any; active?: boolean }) {
  const winnerTeam = match.winner !== undefined && match.winner !== null ? match.teams?.[match.winner] : null;

  return (
    <Card className="bg-zinc-900/60 border-zinc-800 hover:border-blue-500/40 transition-colors">
      <CardContent className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-2">
              {match.group?.name || 'Grupo'} · {match.gameType}
            </p>
            <h3 className="text-xl font-black uppercase italic text-zinc-100 leading-tight">{match.name}</h3>
          </div>
          <span className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
            match.status === 'completed'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
          }`}>
            {statusLabels[match.status] || match.status}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {match.teams?.map((team: any, index: number) => (
            <div key={`${match._id}-${team.name}`} className={`rounded-xl border p-4 ${
              winnerTeam && index === match.winner
                ? 'border-yellow-500/30 bg-yellow-500/10'
                : 'border-zinc-800 bg-zinc-950/60'
            }`}>
              <div className="flex justify-between items-center mb-3">
                <p className="font-black uppercase italic text-zinc-100">{team.name}</p>
                <p className="text-2xl font-black font-mono text-blue-400">{team.score || 0}</p>
              </div>
              <div className="space-y-1">
                {team.players?.map((player: any) => (
                  <p key={(player.user?._id || player.user)} className="text-xs text-zinc-500">
                    {player.user?.username || 'Jugador'}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-800">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <TrophyIcon className="w-4 h-4 text-yellow-500" />
            {match.status === 'completed'
              ? winnerTeam ? `Ganó ${winnerTeam.name}` : 'Empate'
              : 'Resultado pendiente'}
          </div>
          {active ? (
            <Link href={`/groups/${match.group?._id || match.group}/lobby`}>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-500 font-black uppercase">
                Cargar resultado
              </Button>
            </Link>
          ) : (
            <Link href={`/groups/${match.group?._id || match.group}`}>
              <Button size="sm" variant="outline" className="font-black uppercase">
                Ver grupo
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
