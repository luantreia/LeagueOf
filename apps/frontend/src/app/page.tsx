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
  SparklesIcon,
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

function getScore(ranking: any) {
  if (!ranking) return '-';
  if (ranking.rankingType === 'elo') return `${Math.round(ranking.elo?.rating || 0)} ELO`;
  return `${Math.round(ranking.points?.total || 0)} pts`;
}

function getWinnerLabel(match: any) {
  if (match.status !== 'completed') return 'Resultado pendiente';
  if (match.winner === undefined || match.winner === null) return 'Empate';
  return `Gano ${match.teams?.[match.winner]?.name || 'Equipo ganador'}`;
}

function getUserRanking(rankings: any[], userId?: string) {
  if (!userId) return null;
  return rankings.find((ranking) => (ranking.user?._id || ranking.user) === userId) || null;
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
    queryFn: () => apiClient.getMatches({ limit: 12 }),
    enabled: !!user,
  });

  const { data: summaryResponse } = useQuery({
    queryKey: ['dashboard', 'matches-summary'],
    queryFn: () => apiClient.getMatchSummary(),
    enabled: !!user,
  });

  const { data: rankingResponse, isLoading: isLoadingRankings } = useQuery({
    queryKey: ['dashboard', 'rankings'],
    queryFn: () => apiClient.getGlobalLeaderboard(1, 25),
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
  const rankings = rankingResponse?.rankings || rankingResponse?.data?.rankings || [];
  const personalRanking = getUserRanking(rankings, user?._id);
  const topRankings = rankings.slice(0, 4);
  const activeMatches = matches.filter((match: any) => match.status !== 'completed').slice(0, 4);
  const completedMatches = matches.filter((match: any) => match.status === 'completed').slice(0, 3);
  const primaryGroup = groups[0];
  const winRate = summary.total > 0 ? Math.round((summary.wins / summary.total) * 100) : 0;
  const isDashboardLoading = isLoadingGroups || isLoadingMatches || isLoadingRankings;

  const actionItems = [
    ...activeMatches.map((match: any) => ({
      key: `match-${match._id}`,
      tone: match.status === 'pending' ? 'amber' : 'blue',
      eyebrow: statusLabels[match.status] || 'Partida activa',
      title: match.name || 'Partida sin nombre',
      text: `${match.group?.name || 'Grupo'} - ${match.gameType || 'custom'}`,
      href: `/groups/${getGroupId(match)}/lobby`,
      action: match.status === 'pending' ? 'Cargar resultado' : 'Abrir lobby',
    })),
    ...(groups.length === 0
      ? [{
          key: 'first-group',
          tone: 'emerald',
          eyebrow: 'Primer paso',
          title: 'Crea o unite a un grupo',
          text: 'Los rankings y partidas nacen dentro de comunidades.',
          href: '/groups',
          action: 'Ir a grupos',
        }]
      : []),
  ].slice(0, 4);

  const activityItems = [
    ...activeMatches.map((match: any) => ({
      key: `active-${match._id}`,
      icon: <PlayIcon className="w-4 h-4" />,
      title: match.status === 'pending' ? 'Resultado pendiente' : 'Partida en curso',
      text: `${match.name} en ${match.group?.name || 'un grupo'}`,
      href: `/groups/${getGroupId(match)}/lobby`,
    })),
    ...completedMatches.map((match: any) => ({
      key: `completed-${match._id}`,
      icon: <TrophyIcon className="w-4 h-4" />,
      title: getWinnerLabel(match),
      text: `${match.name} - ${match.group?.name || 'Grupo'}`,
      href: `/groups/${getGroupId(match)}`,
    })),
    ...groups.slice(0, 2).map((group: any) => ({
      key: `group-${group._id}`,
      icon: <UserGroupIcon className="w-4 h-4" />,
      title: group.name,
      text: `${group.members?.length || 0} miembros - @${group.handle}`,
      href: `/groups/${group._id}`,
    })),
  ].slice(0, 7);

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
      <div className="min-h-screen bg-zinc-950 px-4 sm:px-6 py-10 lg:px-12">
        <div className="max-w-7xl mx-auto space-y-8">
          <header className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 items-stretch">
            <section className="border border-zinc-800 bg-zinc-900/40 rounded-2xl p-6 sm:p-8 overflow-hidden relative">
              <div className="absolute inset-x-0 top-0 h-1 bg-blue-600" />
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-400 italic">
                    Hoy en League Of
                  </p>
                  <div>
                    <h1 className="text-3xl sm:text-5xl font-black text-zinc-50 italic tracking-tighter uppercase leading-none">
                      @{user.username}
                    </h1>
                    <p className="text-zinc-500 mt-3 max-w-2xl">
                      Tu tablero muestra pendientes, movimiento competitivo y el siguiente paso mas probable.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3">
                  <Metric label="Winrate" value={`${winRate}%`} tone="blue" />
                  <Metric label="Activas" value={summary.active} tone="amber" />
                  <Metric label="Victorias" value={summary.wins} tone="emerald" />
                  <Metric label="Rank" value={personalRanking?.rank ? `#${personalRanking.rank}` : '-'} tone="zinc" />
                </div>
              </div>
            </section>

            <section className="border border-zinc-800 bg-zinc-900/40 rounded-2xl p-6 sm:p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-600 mb-5">
                Estado personal
              </p>
              <div className="flex items-center justify-between gap-5">
                <div>
                  <p className="text-4xl font-black italic text-zinc-100 leading-none">{getScore(personalRanking)}</p>
                  <p className="text-sm text-zinc-500 mt-3">
                    {personalRanking?.group?.name || 'Ranking global combinado'}
                  </p>
                </div>
                <div className="h-16 w-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <ChartBarIcon className="w-8 h-8" />
                </div>
              </div>
              <Link href="/rankings">
                <Button variant="outline" className="w-full mt-6 font-black uppercase">
                  Ver tabla completa
                </Button>
              </Link>
            </section>
          </header>

          <section className="grid grid-cols-1 lg:grid-cols-[1.45fr_0.9fr] gap-8">
            <div className="space-y-8">
              <PanelHeader title="Requiere atencion" actionHref="/matches" actionLabel="Partidas" />
              {isDashboardLoading ? (
                <EmptyPanel text="Buscando pendientes..." />
              ) : actionItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {actionItems.map((item) => (
                    <ActionCard key={item.key} item={item} />
                  ))}
                </div>
              ) : (
                <EmptyPanel
                  text="No tienes pendientes ahora mismo."
                  actionHref={primaryGroup ? `/groups/${primaryGroup._id}/lobby` : '/groups'}
                  actionLabel={primaryGroup ? 'Crear lobby' : 'Ir a grupos'}
                />
              )}

              <PanelHeader title="Actividad reciente" actionHref="/matches" actionLabel="Ver historial" />
              {isDashboardLoading ? (
                <EmptyPanel text="Cargando actividad..." />
              ) : activityItems.length > 0 ? (
                <Card className="bg-zinc-900/40 border-zinc-800">
                  <CardContent className="p-3 sm:p-4 divide-y divide-zinc-800">
                    {activityItems.map((item) => (
                      <ActivityRow key={item.key} item={item} />
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <EmptyPanel text="Aun no hay actividad. Crea un grupo o registra tu primera partida." actionHref="/groups" actionLabel="Empezar" />
              )}
            </div>

            <aside className="space-y-8">
              <PanelHeader title="Siguiente movimiento" actionHref="/groups" actionLabel="Grupos" />
              <Card className="bg-zinc-900/40 border-zinc-800">
                <CardContent className="p-5 space-y-3">
                  <QuickAction
                    href={primaryGroup ? `/groups/${primaryGroup._id}/lobby` : '/groups'}
                    icon={<PlayIcon className="w-5 h-5" />}
                    label={primaryGroup ? 'Abrir lobby principal' : 'Elegir grupo'}
                    text={primaryGroup ? primaryGroup.name : 'Necesitas una comunidad para jugar'}
                    primary
                  />
                  <QuickAction
                    href="/matches"
                    icon={<ClockIcon className="w-5 h-5" />}
                    label="Revisar historial"
                    text={`${summary.completed || 0} partidas finalizadas`}
                  />
                  <QuickAction
                    href="/groups"
                    icon={<PlusIcon className="w-5 h-5" />}
                    label="Crear o unirme"
                    text={`${groups.length} grupos activos para ti`}
                  />
                </CardContent>
              </Card>

              <PanelHeader title="Top competitivo" actionHref="/rankings" actionLabel="Ranking" />
              <Card className="bg-zinc-900/40 border-zinc-800">
                <CardContent className="p-5 space-y-3">
                  {topRankings.length > 0 ? (
                    topRankings.map((ranking: any, index: number) => (
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
                        <p className="font-black text-zinc-100">{getScore(ranking)}</p>
                      </div>
                    ))
                  ) : (
                    <EmptyPanel text="El ranking aparece cuando haya grupos y resultados." compact />
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

function Metric({ label, value, tone = 'zinc' }: { label: string; value: number | string; tone?: 'zinc' | 'emerald' | 'amber' | 'blue' }) {
  const toneClass = {
    zinc: 'text-zinc-100',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    blue: 'text-blue-400',
  }[tone];

  return (
    <div className="bg-zinc-950/70 border border-zinc-800 px-4 py-4 rounded-xl min-w-[96px]">
      <span className="block text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">{label}</span>
      <span className={`text-2xl font-black italic leading-none ${toneClass}`}>{value}</span>
    </div>
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

type ActionTone = 'amber' | 'blue' | 'emerald';

function ActionCard({ item }: { item: any }) {
  const toneClasses: Record<ActionTone, string> = {
    amber: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    blue: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  };
  const toneClass = toneClasses[item.tone as ActionTone] || toneClasses.blue;

  return (
    <Card className="bg-zinc-900/60 border-zinc-800 hover:border-blue-500/40 transition-colors">
      <CardContent className="p-5 min-h-[190px] flex flex-col justify-between gap-5">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${toneClass}`}>
              {item.eyebrow}
            </span>
            <SparklesIcon className="w-5 h-5 text-zinc-700" />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase italic text-zinc-100 leading-tight">{item.title}</h3>
            <p className="text-sm text-zinc-500 mt-2">{item.text}</p>
          </div>
        </div>
        <Link href={item.href}>
          <Button className="w-full bg-blue-600 hover:bg-blue-500 font-black uppercase">
            {item.action}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function ActivityRow({ item }: { item: any }) {
  return (
    <Link href={item.href} className="flex items-center gap-4 p-4 rounded-xl hover:bg-zinc-950/70 transition-colors">
      <div className="h-10 w-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-blue-400 shrink-0">
        {item.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-black uppercase italic text-zinc-100 truncate">{item.title}</p>
        <p className="text-sm text-zinc-500 truncate">{item.text}</p>
      </div>
      <ArrowRightIcon className="w-4 h-4 text-zinc-700 shrink-0" />
    </Link>
  );
}

function QuickAction({ href, icon, label, text, primary = false }: {
  href: string;
  icon: React.ReactNode;
  label: string;
  text: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-4 rounded-xl border p-4 transition-colors ${
        primary
          ? 'bg-blue-600 border-blue-500 text-zinc-50 hover:bg-blue-500'
          : 'bg-zinc-950/60 border-zinc-800 text-zinc-100 hover:border-blue-500/40'
      }`}
    >
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
        primary ? 'bg-blue-500/40 text-zinc-50' : 'bg-zinc-900 text-blue-400'
      }`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-black uppercase italic truncate">{label}</p>
        <p className={`text-sm truncate ${primary ? 'text-blue-100' : 'text-zinc-500'}`}>{text}</p>
      </div>
    </Link>
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
