'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowRightIcon,
  BellIcon,
  BoltIcon,
  ChartBarIcon,
  ClockIcon,
  PlayIcon,
  PlusIcon,
  TrophyIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const statusLabels: Record<string, string> = {
  in_progress: 'En curso',
  pending: 'Pendiente',
  completed: 'Finalizada',
  cancelled: 'Cancelada',
};

function getGroupId(match: any) {
  return match.group?._id || match.group;
}

function getWinnerLabel(match: any) {
  if (match.status !== 'completed') return 'Resultado pendiente';
  if (match.winner === undefined || match.winner === null) return 'Empate';
  return `Gano ${match.teams?.[match.winner]?.name || 'Equipo ganador'}`;
}

export default function Home() {
  const { user, isLoading } = useAuth();

  const { data: groupsResponse, isLoading: isLoadingGroups } = useQuery({
    queryKey: ['dashboard', 'groups'],
    queryFn: () => apiClient.getGroups({ filter: 'joined' }),
    enabled: !!user,
  });

  const { data: matchesResponse, isLoading: isLoadingMatches } = useQuery({
    queryKey: ['dashboard', 'matches'],
    queryFn: () => apiClient.getMatches({ limit: 8 }),
    enabled: !!user,
  });

  const { data: summaryResponse } = useQuery({
    queryKey: ['dashboard', 'matches-summary'],
    queryFn: () => apiClient.getMatchSummary(),
    enabled: !!user,
  });

  const { data: rankingResponse } = useQuery({
    queryKey: ['dashboard', 'rankings'],
    queryFn: () => apiClient.getGlobalLeaderboard(1, 5),
    enabled: !!user,
  });

  const groups = useMemo(() => groupsResponse?.data || [], [groupsResponse]);
  const matches = useMemo(() => matchesResponse?.data || [], [matchesResponse]);
  const summary = summaryResponse?.data || {
    total: user?.stats?.totalMatches || 0,
    active: 0,
    completed: user?.stats?.totalMatches || 0,
    wins: user?.stats?.totalWins || 0,
    losses: user?.stats?.totalLosses || 0,
    draws: 0,
  };
  const rankings = rankingResponse?.data?.rankings || [];

  const activeMatches = useMemo(
    () => matches.filter((match: any) => match.status !== 'completed').slice(0, 3),
    [matches]
  );
  const recentMatches = useMemo(
    () => matches.filter((match: any) => match.status === 'completed').slice(0, 3),
    [matches]
  );
  const recentGroups = groups.slice(0, 3);
  const firstGroup = groups[0];
  const winRate = summary.total > 0 ? Math.round((summary.wins / summary.total) * 100) : 0;
  const isDashboardLoading = isLoadingGroups || isLoadingMatches;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]"></div>
          <div className="absolute inset-0 bg-blue-600/20 blur-2xl rounded-full" />
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-zinc-950 px-4 sm:px-6 py-12 lg:px-12">
        <div className="max-w-7xl mx-auto space-y-12">
          <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-2 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.6)]" />
                <h1 className="text-3xl sm:text-5xl font-black text-zinc-50 italic tracking-tighter uppercase leading-none">
                  Dashboard
                </h1>
              </div>
              <p className="text-zinc-500 font-bold uppercase tracking-[0.18em] text-[10px] sm:text-xs">
                Bienvenido de vuelta, <span className="text-zinc-100 italic">@{user.username}</span>.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full xl:w-auto">
              <StatPill label="Partidas" value={summary.total} />
              <StatPill label="Victorias" value={summary.wins} tone="emerald" />
              <StatPill label="Derrotas" value={summary.losses} tone="red" />
              <StatPill label="Winrate" value={`${winRate}%`} tone="blue" />
            </div>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <DashboardAction
              href={firstGroup ? `/groups/${firstGroup._id}/lobby` : '/groups'}
              eyebrow="Partidas"
              title={firstGroup ? 'Crear Lobby' : 'Elegir Grupo'}
              icon={<PlayIcon className="w-9 h-9" />}
              primary
            />
            <DashboardAction
              href="/matches"
              eyebrow="Historial"
              title="Ver Partidas"
              icon={<ClockIcon className="w-9 h-9" />}
            />
            <DashboardAction
              href="/groups"
              eyebrow="Comunidad"
              title="Mis Grupos"
              icon={<UserGroupIcon className="w-9 h-9" />}
            />
            <DashboardAction
              href="/rankings"
              eyebrow="Ranking"
              title="Clasificacion"
              icon={<TrophyIcon className="w-9 h-9" />}
            />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <PanelHeader title="Partidas abiertas" actionHref="/matches" actionLabel="Ver todas" />
              {isDashboardLoading ? (
                <EmptyPanel text="Cargando partidas..." />
              ) : activeMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {activeMatches.map((match: any) => (
                    <MatchCard key={match._id} match={match} active />
                  ))}
                </div>
              ) : (
                <EmptyPanel
                  text="No hay partidas abiertas."
                  actionHref={firstGroup ? `/groups/${firstGroup._id}/lobby` : '/groups'}
                  actionLabel={firstGroup ? 'Crear lobby' : 'Ir a grupos'}
                />
              )}

              <PanelHeader title="Completadas recientes" actionHref="/matches?status=completed" actionLabel="Historial" />
              {isDashboardLoading ? (
                <EmptyPanel text="Cargando historial..." />
              ) : recentMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {recentMatches.map((match: any) => (
                    <MatchCard key={match._id} match={match} />
                  ))}
                </div>
              ) : (
                <EmptyPanel text="Todavia no hay partidas completadas." />
              )}
            </div>

            <aside className="space-y-8">
              <PanelHeader title="Tus grupos" actionHref="/groups" actionLabel="Gestionar" />
              <Card className="bg-zinc-900/40 border-zinc-800">
                <CardContent className="p-5 space-y-3">
                  {isDashboardLoading ? (
                    <p className="text-sm text-zinc-500">Cargando grupos...</p>
                  ) : recentGroups.length > 0 ? (
                    recentGroups.map((group: any) => (
                      <Link
                        key={group._id}
                        href={`/groups/${group._id}`}
                        className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 hover:border-blue-500/40 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="font-black uppercase italic text-zinc-100 truncate">{group.name}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-blue-500/70">@{group.handle}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-black text-zinc-100">{group.members?.length || 0}</p>
                          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">miembros</p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <EmptyPanel text="No perteneces a ningun grupo." actionHref="/groups" actionLabel="Crear o unirme" compact />
                  )}
                </CardContent>
              </Card>

              <PanelHeader title="Top rankings" actionHref="/rankings" actionLabel="Ver ranking" />
              <Card className="bg-zinc-900/40 border-zinc-800">
                <CardContent className="p-5 space-y-3">
                  {rankings.length > 0 ? (
                    rankings.map((ranking: any, index: number) => (
                      <div key={ranking._id || `${ranking.user?._id}-${ranking.group?._id}`} className="flex items-center gap-3 rounded-xl bg-zinc-950/60 border border-zinc-800 p-4">
                        <span className="w-8 text-center text-lg font-black italic text-blue-500">#{ranking.rank || index + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-black uppercase italic text-zinc-100 truncate">
                            {ranking.user?.displayName || ranking.user?.username || 'Jugador'}
                          </p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 truncate">
                            {ranking.group?.name || 'Global'}
                          </p>
                        </div>
                        <p className="font-black text-zinc-100">{Math.round(ranking.rating || ranking.points || 0)}</p>
                      </div>
                    ))
                  ) : (
                    <EmptyPanel text="El ranking se completa cuando haya resultados." compact />
                  )}
                </CardContent>
              </Card>
            </aside>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 overflow-hidden relative selection:bg-blue-500/30">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] -mr-[400px] -mt-[400px] animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[100px] -ml-[300px] -mb-[300px]" />

      <div className="container mx-auto px-6 py-32 lg:py-48 relative z-10">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-3 px-5 py-2 mb-10 text-[10px] font-black tracking-[0.3em] text-blue-400 uppercase bg-blue-950/40 border border-blue-500/20 rounded-full italic backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Temporada activa
          </div>

          <h1 className="text-6xl sm:text-8xl md:text-[10rem] font-black text-zinc-100 mb-8 tracking-tighter leading-[0.85] italic uppercase select-none">
            LEAGUE <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 drop-shadow-[0_0_35px_rgba(37,99,235,0.3)]">OF</span>
          </h1>

          <p className="text-lg md:text-2xl text-zinc-500 mb-14 font-bold leading-relaxed max-w-2xl uppercase tracking-tighter">
            Gestiona grupos, partidas, lobbies y rankings competitivos desde un solo lugar.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 mb-24">
            <Link href="/auth/register" className="w-full sm:w-auto">
              <Button size="lg" className="h-20 w-full sm:px-12 text-zinc-50 bg-blue-600 hover:bg-blue-500 font-black italic uppercase tracking-[0.2em] text-base rounded-2xl shadow-2xl shadow-blue-600/30 border-b-4 border-blue-900 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-4 group">
                Crear cuenta
                <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </Button>
            </Link>
            <Link href="/auth/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="h-20 w-full sm:px-12 bg-zinc-900/50 border-zinc-800 text-zinc-100 hover:bg-zinc-800 font-black italic uppercase tracking-[0.2em] text-base rounded-2xl backdrop-blur-sm transition-all shadow-xl">
                Iniciar sesion
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            <Feature icon={<TrophyIcon className="w-7 h-7" />} title="Rankings" text="Rankings por grupo y globales actualizados con cada resultado." />
            <Feature icon={<BoltIcon className="w-7 h-7" />} title="Partidas" text="Crea lobbies, carga resultados y conserva el historial competitivo." />
            <Feature icon={<UserGroupIcon className="w-7 h-7" />} title="Grupos" text="Arma comunidades privadas o publicas con sus propias reglas." />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value, tone = 'zinc' }: { label: string; value: number | string; tone?: 'zinc' | 'emerald' | 'red' | 'blue' }) {
  const toneClass = {
    zinc: 'text-zinc-100',
    emerald: 'text-emerald-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
  }[tone];

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 px-4 sm:px-6 py-4 rounded-2xl text-center">
      <span className="block text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">{label}</span>
      <span className={`text-2xl font-black italic leading-none ${toneClass}`}>{value}</span>
    </div>
  );
}

function DashboardAction({ href, eyebrow, title, icon, primary = false }: {
  href: string;
  eyebrow: string;
  title: string;
  icon: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <Link href={href} className="block">
      <Card className={`group h-full transition-all overflow-hidden ${
        primary
          ? 'bg-blue-600 border-blue-500 hover:bg-blue-500 shadow-2xl shadow-blue-600/20'
          : 'bg-zinc-900/50 border-zinc-800 hover:border-blue-500/50'
      }`}>
        <CardContent className="p-6 min-h-[150px] flex items-center justify-between gap-4">
          <div>
            <p className={`text-[10px] font-black uppercase tracking-[0.25em] italic mb-2 ${primary ? 'text-blue-100' : 'text-zinc-600'}`}>
              {eyebrow}
            </p>
            <p className="text-2xl font-black text-zinc-50 uppercase italic tracking-tighter">{title}</p>
          </div>
          <div className={`${primary ? 'text-zinc-50' : 'text-blue-500'} group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function PanelHeader({ title, actionHref, actionLabel }: { title: string; actionHref: string; actionLabel: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-2xl font-black text-zinc-100 italic tracking-tighter uppercase leading-none">{title}</h2>
      <Link href={actionHref} className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300">
        {actionLabel}
      </Link>
    </div>
  );
}

function EmptyPanel({ text, actionHref, actionLabel, compact = false }: {
  text: string;
  actionHref?: string;
  actionLabel?: string;
  compact?: boolean;
}) {
  return (
    <div className={`border border-dashed border-zinc-800 rounded-2xl text-center text-zinc-500 ${compact ? 'p-5' : 'p-10'}`}>
      <BellIcon className="w-8 h-8 mx-auto mb-3 opacity-30" />
      <p className="text-sm">{text}</p>
      {actionHref && actionLabel && (
        <Link href={actionHref}>
          <Button size="sm" className="mt-5 bg-blue-600 hover:bg-blue-500 font-black uppercase">
            {actionLabel}
          </Button>
        </Link>
      )}
    </div>
  );
}

function MatchCard({ match, active = false }: { match: any; active?: boolean }) {
  const groupId = getGroupId(match);

  return (
    <Card className="bg-zinc-900/60 border-zinc-800 hover:border-blue-500/40 transition-colors">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-2 truncate">
              {match.group?.name || 'Grupo'} / {match.gameType || 'custom'}
            </p>
            <h3 className="text-lg font-black uppercase italic text-zinc-100 leading-tight truncate">{match.name}</h3>
          </div>
          <span className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
            match.status === 'completed'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
          }`}>
            {statusLabels[match.status] || match.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {match.teams?.slice(0, 2).map((team: any, index: number) => (
            <div key={`${match._id}-${team.name}-${index}`} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
              <div className="flex justify-between gap-3">
                <p className="font-black uppercase italic text-zinc-100 truncate">{team.name}</p>
                <p className="text-xl font-black font-mono text-blue-400">{team.score || 0}</p>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-600 mt-2">{team.players?.length || 0} jugadores</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-800">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <ChartBarIcon className="w-4 h-4 text-yellow-500" />
            {getWinnerLabel(match)}
          </div>
          <Link href={active ? `/groups/${groupId}/lobby` : `/groups/${groupId}`}>
            <Button size="sm" variant={active ? 'primary' : 'outline'} className="font-black uppercase">
              {active ? 'Cargar resultado' : 'Ver detalle'}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="group space-y-4">
      <div className="h-14 w-14 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-all shadow-xl">
        {icon}
      </div>
      <h3 className="text-lg font-black text-zinc-100 uppercase italic tracking-widest">{title}</h3>
      <p className="text-zinc-500 text-sm font-bold uppercase tracking-tight leading-relaxed">{text}</p>
    </div>
  );
}
