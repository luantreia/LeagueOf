'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/api-client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const getScore = (ranking: any) => {
  if (ranking.rankingType === 'elo') {
    return `${ranking.elo?.rating ?? 0} ELO`;
  }

  return `${ranking.points?.total ?? 0} pts`;
};

const getPlayerName = (ranking: any) => {
  return ranking.user?.displayName || ranking.user?.username || 'Jugador';
};

export default function RankingsPage() {
  const [selectedGroupId, setSelectedGroupId] = useState('');

  const { data: groupsResponse, isLoading: isLoadingGroups } = useQuery({
    queryKey: ['groups', 'rankings-filter'],
    queryFn: () => apiClient.getGroups({ filter: 'joined' }),
  });

  const groups = useMemo(() => groupsResponse?.data || [], [groupsResponse]);
  const activeGroupId = selectedGroupId || groups[0]?._id || '';

  useEffect(() => {
    if (!selectedGroupId && groups.length > 0) {
      setSelectedGroupId(groups[0]._id);
    }
  }, [groups, selectedGroupId]);

  const { data: leaderboardResponse, isLoading: isLoadingLeaderboard } = useQuery({
    queryKey: ['rankings', activeGroupId],
    queryFn: () => apiClient.getLeaderboard(activeGroupId, 1, 100),
    enabled: !!activeGroupId,
  });

  const rankings = leaderboardResponse?.rankings || [];
  const selectedGroup = useMemo(
    () => groups.find((group: any) => group._id === activeGroupId),
    [groups, activeGroupId]
  );
  const isLoading = isLoadingGroups || isLoadingLeaderboard;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Rankings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Leaderboards reales por grupo, con el sistema de puntaje definido para cada comunidad.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-8">
        <aside className="md:col-span-1 space-y-6">
          <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Filtrar por Grupo</h3>
            <div className="space-y-2">
              {groups.map((group: any) => (
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
            </div>
          </section>
        </aside>

        <main className="md:col-span-3">
          <Card>
            <CardHeader className="border-b border-gray-100 dark:border-gray-800">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <CardTitle>
                  {selectedGroup?.name || 'Ranking del Grupo'}
                </CardTitle>
                <div className="text-xs text-gray-500 font-medium">
                  {leaderboardResponse?.total ?? 0} registros reales
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 text-left text-xs text-gray-500 uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">#</th>
                      <th className="px-6 py-4">Jugador</th>
                      <th className="px-6 py-4">Grupo</th>
                      <th className="px-6 py-4">ELO / Puntos</th>
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
                          No hay rankings todavia. Se crean cuando alguien crea o se une a un grupo, y se actualizan con partidas.
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
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
