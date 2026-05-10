'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/api-client';
import { useAuth } from '@/lib/auth-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

type FilterMode = 'group' | 'global';
type PlayerRelationFilter = 'all' | 'synergy' | 'rivalry';

const getScore = (ranking: any) => {
  if (ranking.rankingType === 'elo') {
    return `${Math.round(ranking.elo?.rating ?? 0)} ELO`;
  }

  return `${Math.round(ranking.points?.total ?? 0)} pts`;
};

const getPlayerName = (ranking: any) => {
  return ranking.user?.displayName || ranking.user?.username || ranking.guest?.name || 'Jugador';
};

const getPlayerKey = (player: any) => {
  const userId = player.user?._id || player.user;
  const guestId = player.guest?._id || player.guest;
  if (userId) return `user:${userId}`;
  if (guestId) return `guest:${guestId}`;
  return '';
};

const getPlayerNameFromSlot = (player: any) => {
  return player.user?.displayName || player.user?.username || player.guest?.name || 'Jugador';
};

const getUserTeamIndex = (match: any, userId?: string) => {
  if (!userId) return -1;
  return match.teams?.findIndex((team: any) =>
    team.players?.some((player: any) => (player.user?._id || player.user) === userId)
  ) ?? -1;
};

const getResultForTeam = (match: any, teamIndex: number) => {
  if (teamIndex < 0) return 'Sin participacion';
  if (match.winner === undefined || match.winner === null) return 'Empate';
  return match.winner === teamIndex ? 'Victoria' : 'Derrota';
};

const updateStats = (entry: any, result: string) => {
  entry.stats.matchesPlayed += 1;
  if (result === 'Victoria') entry.stats.wins += 1;
  if (result === 'Derrota') entry.stats.losses += 1;
  if (result === 'Empate') entry.stats.draws += 1;
  entry.stats.winRate = entry.stats.matchesPlayed > 0
    ? (entry.stats.wins / entry.stats.matchesPlayed) * 100
    : 0;
  entry.points.total = entry.stats.wins * 3 + entry.stats.draws;
};

const createAggregateEntry = (key: string, player: any, groupName = 'Global') => ({
  _id: key,
  user: player.user,
  guest: player.guest,
  group: { name: groupName },
  rankingType: 'points',
  points: { total: 0 },
  stats: {
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winRate: 0,
  },
});

export default function RankingsPage() {
  const { user } = useAuth();
  const [filterMode, setFilterMode] = useState<FilterMode>('group');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedGameType, setSelectedGameType] = useState('');
  const [selectedPlayerKey, setSelectedPlayerKey] = useState('');
  const [playerRelation, setPlayerRelation] = useState<PlayerRelationFilter>('all');
  const [groupSearch, setGroupSearch] = useState('');

  const { data: groupsResponse, isLoading: isLoadingGroups } = useQuery({
    queryKey: ['groups', 'rankings-filter'],
    queryFn: () => apiClient.getGroups({ filter: 'joined' }),
  });

  const groups = useMemo(() => groupsResponse?.data || [], [groupsResponse]);
  const filteredGroups = useMemo(() => {
    const search = groupSearch.trim().toLowerCase();
    if (!search) return groups;

    return groups.filter((group: any) =>
      group.name?.toLowerCase().includes(search)
      || group.handle?.toLowerCase().includes(search)
    );
  }, [groups, groupSearch]);
  const activeGroupId = selectedGroupId || groups[0]?._id || '';

  useEffect(() => {
    if (!selectedGroupId && groups.length > 0) {
      setSelectedGroupId(groups[0]._id);
    }
  }, [groups, selectedGroupId]);

  const { data: leaderboardResponse, isLoading: isLoadingLeaderboard } = useQuery({
    queryKey: ['rankings', activeGroupId],
    queryFn: () => apiClient.getLeaderboard(activeGroupId, 1, 100),
    enabled: filterMode === 'group' && !!activeGroupId,
  });

  const { data: matchesResponse, isLoading: isLoadingMatches } = useQuery({
    queryKey: ['matches', 'rankings-global-filters'],
    queryFn: () => apiClient.getMatches({ status: 'completed', isRanked: true, limit: 1000 }),
  });

  const matches = useMemo<any[]>(() => matchesResponse?.data || [], [matchesResponse]);
  const selectedGroup = useMemo(
    () => groups.find((group: any) => group._id === activeGroupId),
    [groups, activeGroupId]
  );

  const gameTypes = useMemo<string[]>(() => {
    const types = matches.reduce<string[]>((values, match) => {
      if (typeof match.gameType === 'string' && match.gameType.length > 0) values.push(match.gameType);
      return values;
    }, []);
    return Array.from(new Set<string>(types)).sort();
  }, [matches]);

  const playerOptions = useMemo(() => {
    const players = new Map<string, { key: string; name: string }>();
    matches.forEach((match) => {
      match.teams?.forEach((team: any) => {
        team.players?.forEach((player: any) => {
          const key = getPlayerKey(player);
          if (!key || key === `user:${user?._id}`) return;
          players.set(key, { key, name: getPlayerNameFromSlot(player) });
        });
      });
    });
    return Array.from(players.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [matches, user?._id]);

  const gameRankings = useMemo(() => {
    const rankingMap = new Map<string, any>();

    matches
      .filter((match) => !selectedGameType || match.gameType === selectedGameType)
      .forEach((match) => {
        match.teams?.forEach((team: any, teamIndex: number) => {
          const result = getResultForTeam(match, teamIndex);
          team.players?.forEach((player: any) => {
            const key = getPlayerKey(player);
            if (!key) return;
            if (!rankingMap.has(key)) {
              rankingMap.set(key, createAggregateEntry(key, player, 'Todos tus grupos'));
            }
            updateStats(rankingMap.get(key), result);
          });
        });
      });

    return Array.from(rankingMap.values())
      .sort((a, b) => b.points.total - a.points.total || b.stats.winRate - a.stats.winRate)
      .map((ranking, index) => ({ ...ranking, rank: index + 1 }));
  }, [matches, selectedGameType]);

  const playerHistory = useMemo(() => {
    if (!selectedPlayerKey || !user?._id) return [];

    return matches
      .filter((match) => !selectedGameType || match.gameType === selectedGameType)
      .map((match) => {
        const userTeamIndex = getUserTeamIndex(match, user._id);
        const playerTeamIndex = match.teams?.findIndex((team: any) =>
          team.players?.some((player: any) => getPlayerKey(player) === selectedPlayerKey)
        ) ?? -1;

        if (userTeamIndex < 0 || playerTeamIndex < 0) return null;

        const relation = userTeamIndex === playerTeamIndex ? 'Mismo equipo' : 'Rival';

        return {
          _id: match._id,
          name: match.name,
          groupName: match.group?.name || 'Grupo',
          gameType: match.gameType,
          date: match.completedAt || match.createdAt,
          relation,
          result: getResultForTeam(match, userTeamIndex),
        };
      })
      .filter(Boolean)
      .filter((match: any) => {
        if (playerRelation === 'synergy') return match.relation === 'Mismo equipo';
        if (playerRelation === 'rivalry') return match.relation === 'Rival';
        return true;
      });
  }, [matches, playerRelation, selectedGameType, selectedPlayerKey, user?._id]);

  const rankings = filterMode === 'group'
    ? leaderboardResponse?.rankings || []
    : gameRankings;

  const selectedPlayer = playerOptions.find((player) => player.key === selectedPlayerKey);
  const isLoading = isLoadingGroups || (filterMode === 'group' ? isLoadingLeaderboard : isLoadingMatches);
  const showPlayerHistory = filterMode === 'global' && !!selectedPlayerKey;
  const title = filterMode === 'group'
    ? selectedGroup?.name || 'Ranking del Grupo'
    : selectedPlayerKey
      ? `Historial con ${selectedPlayer?.name || 'jugador'}${selectedGameType ? ` en ${selectedGameType}` : ''}`
      : `Ranking global${selectedGameType ? ` de ${selectedGameType}` : ''}`;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Rankings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Rankings por grupo y filtros globales combinables por juego, jugador, sinergia o rivalidad.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-8">
        <aside className="md:col-span-1 space-y-6">
          <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Filtros</h3>
            <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
              {[
                ['group', 'Filtrar por grupo'],
                ['global', 'Filtros globales'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilterMode(value as FilterMode)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    filterMode === value
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold'
                      : 'hover:bg-white/5 text-gray-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {filterMode === 'group' && (
            <section>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Grupo</h3>
              <input
                value={groupSearch}
                onChange={(event) => setGroupSearch(event.target.value)}
                placeholder="Buscar grupo"
                className="w-full h-11 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 text-sm text-gray-700 dark:text-gray-200 mb-3"
              />
              <div className="space-y-2">
                {filteredGroups.map((group: any) => (
                  <button
                    key={group._id}
                    type="button"
                    onClick={() => setSelectedGroupId(group._id)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      activeGroupId === group._id
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold'
                        : 'hover:bg-white/5 text-gray-400'
                    }`}
                  >
                    {group.name}
                  </button>
                ))}
                {!isLoadingGroups && groups.length === 0 && (
                  <p className="px-4 py-3 text-sm text-gray-500 border border-dashed border-gray-800 rounded-lg">
                    Todavia no perteneces a grupos.
                  </p>
                )}
                {!isLoadingGroups && groups.length > 0 && filteredGroups.length === 0 && (
                  <p className="px-4 py-3 text-sm text-gray-500 border border-dashed border-gray-800 rounded-lg">
                    No hay grupos que coincidan con la busqueda.
                  </p>
                )}
              </div>
            </section>
          )}

          {filterMode === 'global' && (
            <section className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Juego</h3>
                <select
                  value={selectedGameType}
                  onChange={(event) => setSelectedGameType(event.target.value)}
                  className="w-full h-11 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 text-sm text-gray-700 dark:text-gray-200"
                >
                  <option value="">Todos los juegos</option>
                  {gameTypes.map((gameType) => (
                    <option key={gameType} value={gameType}>
                      {gameType}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Jugador</h3>
                <select
                  value={selectedPlayerKey}
                  onChange={(event) => setSelectedPlayerKey(event.target.value)}
                  className="w-full h-11 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 text-sm text-gray-700 dark:text-gray-200"
                >
                  <option value="">Todos los jugadores</option>
                  {playerOptions.map((player) => (
                    <option key={player.key} value={player.key}>
                      {player.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Tipo</h3>
                <select
                  value={playerRelation}
                  onChange={(event) => setPlayerRelation(event.target.value as PlayerRelationFilter)}
                  disabled={!selectedPlayerKey}
                  className="w-full h-11 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 text-sm text-gray-700 dark:text-gray-200"
                >
                  <option value="all">Todas</option>
                  <option value="synergy">Sinergia</option>
                  <option value="rivalry">Rivalidad</option>
                </select>
              </div>
            </section>
          )}
        </aside>

        <main className="md:col-span-3">
          <Card>
            <CardHeader className="border-b border-gray-100 dark:border-gray-800">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <CardTitle>{title}</CardTitle>
                <div className="text-xs text-gray-500 font-medium">
                  {showPlayerHistory
                    ? `${playerHistory.length} partidas`
                    : `${rankings.length} registros`}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {showPlayerHistory ? (
                <HistoryTable history={playerHistory} isLoading={isLoading} />
              ) : (
                <RankingTable rankings={rankings} selectedGroup={selectedGroup} isLoading={isLoading} />
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

function RankingTable({ rankings, selectedGroup, isLoading }: {
  rankings: any[];
  selectedGroup?: any;
  isLoading: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-900/50 text-left text-xs text-gray-500 uppercase font-bold tracking-wider">
          <tr>
            <th className="px-6 py-4">#</th>
            <th className="px-6 py-4">Jugador</th>
            <th className="px-6 py-4">Contexto</th>
            <th className="px-6 py-4">Puntaje</th>
            <th className="px-6 py-4">Winrate</th>
            <th className="px-6 py-4">Partidas</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {isLoading && (
            <tr>
              <td className="px-6 py-10 text-gray-500" colSpan={6}>
                Cargando rankings...
              </td>
            </tr>
          )}
          {!isLoading && rankings.length === 0 && (
            <tr>
              <td className="px-6 py-10 text-gray-500" colSpan={6}>
                No hay registros para este filtro.
              </td>
            </tr>
          )}
          {!isLoading && rankings.map((ranking: any, index: number) => (
            <tr key={ranking._id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              <td className="px-6 py-4 font-black text-lg text-gray-400">{ranking.rank || index + 1}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                    {getPlayerName(ranking)[0]?.toUpperCase()}
                  </div>
                  <span className="font-bold">{getPlayerName(ranking)}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-gray-500">
                {ranking.group?.name || selectedGroup?.name || '-'}
              </td>
              <td className="px-6 py-4 font-bold text-blue-500">{getScore(ranking)}</td>
              <td className="px-6 py-4 text-green-500 font-medium">
                {Math.round(ranking.stats?.winRate || 0)}%
              </td>
              <td className="px-6 py-4 text-gray-500">{ranking.stats?.matchesPlayed || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HistoryTable({ history, isLoading }: { history: any[]; isLoading: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-900/50 text-left text-xs text-gray-500 uppercase font-bold tracking-wider">
          <tr>
            <th className="px-6 py-4">Fecha</th>
            <th className="px-6 py-4">Partida</th>
            <th className="px-6 py-4">Grupo</th>
            <th className="px-6 py-4">Juego</th>
            <th className="px-6 py-4">Relacion</th>
            <th className="px-6 py-4">Resultado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {isLoading && (
            <tr>
              <td className="px-6 py-10 text-gray-500" colSpan={6}>
                Cargando historial...
              </td>
            </tr>
          )}
          {!isLoading && history.length === 0 && (
            <tr>
              <td className="px-6 py-10 text-gray-500" colSpan={6}>
                No hay partidas compartidas con este jugador.
              </td>
            </tr>
          )}
          {!isLoading && history.map((match) => (
            <tr key={match._id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              <td className="px-6 py-4 text-gray-500">
                {match.date ? new Date(match.date).toLocaleDateString() : '-'}
              </td>
              <td className="px-6 py-4 font-bold">{match.name}</td>
              <td className="px-6 py-4 text-gray-500">{match.groupName}</td>
              <td className="px-6 py-4 text-gray-500">{match.gameType}</td>
              <td className="px-6 py-4 text-blue-500 font-medium">{match.relation}</td>
              <td className="px-6 py-4 text-green-500 font-medium">{match.result}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
