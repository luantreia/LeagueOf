'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/api/api-client';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  PlayIcon,
  TrophyIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

export default function GroupLobbyPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [matchName, setMatchName] = useState('');
  const [gameType, setGameType] = useState('League of Legends');
  const [teamAssignments, setTeamAssignments] = useState<Record<string, number>>({});
  const [scores, setScores] = useState([0, 0]);
  const [winner, setWinner] = useState<'0' | '1' | 'draw'>('0');
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);

  const { data: groupResponse, isLoading } = useQuery({
    queryKey: ['group', id],
    queryFn: () => apiClient.getGroup(id as string),
    enabled: !!id,
  });

  const { data: matchesResponse } = useQuery({
    queryKey: ['matches', 'group', id],
    queryFn: () => apiClient.getMatches({ groupId: id }),
    enabled: !!id,
  });

  const { data: guestsResponse } = useQuery({
    queryKey: ['guests', id],
    queryFn: () => apiClient.getGuestsByGroup(id as string),
    enabled: !!id,
  });

  const group = groupResponse?.data;
  const members = useMemo(() => group?.members || [], [group]);
  const guests = useMemo(() => guestsResponse?.data || [], [guestsResponse]);
  const matches = matchesResponse?.data || [];
  const activeMatch = matches.find((match: any) => match._id === activeMatchId)
    || matches.find((match: any) => match.status !== 'completed');
  const completedMatches = matches.filter((match: any) => match.status === 'completed');

  const allPlayers = useMemo(() => [
    ...members.map((m: any) => ({ ...m, type: 'user', id: m.user._id, name: m.user.username })),
    ...guests.map((g: any) => ({ ...g, type: 'guest', id: g._id, name: g.name })),
  ], [members, guests]);

  useEffect(() => {
    if (!allPlayers.length || Object.keys(teamAssignments).length > 0) return;

    const nextAssignments: Record<string, number> = {};
    allPlayers.forEach((player: any, index: number) => {
      nextAssignments[player.id] = index % 2;
    });
    setTeamAssignments(nextAssignments);
  }, [allPlayers, teamAssignments]);

  useEffect(() => {
    if (group && !matchName) {
      setMatchName(`${group.name} - Partida`);
    }
  }, [group, matchName]);

  const isMember = members.some((member: any) => member.user._id === user?._id);

  const createMatchMutation = useMutation({
    mutationFn: () => {
      const teams = [0, 1].map((teamIndex) => ({
        name: teamIndex === 0 ? 'Equipo Azul' : 'Equipo Rojo',
        players: allPlayers
          .filter((player: any) => teamAssignments[player.id] === teamIndex)
          .map((player: any) => ({
            [player.type === 'user' ? 'user' : 'guest']: player.id,
          })),
      }));

      return apiClient.createMatch({
        groupId: id,
        name: matchName,
        gameType,
        teams,
        isRanked: true,
      });
    },
    onSuccess: (response: any) => {
      setActiveMatchId(response.data._id);
      queryClient.invalidateQueries({ queryKey: ['matches', 'group', id] });
      toast.success('Partida creada. Cargá el resultado cuando termine.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'No se pudo crear la partida');
    },
  });

  const completeMatchMutation = useMutation({
    mutationFn: () => apiClient.completeMatch(activeMatch._id, {
      scores,
      winner,
    }),
    onSuccess: () => {
      setActiveMatchId(null);
      queryClient.invalidateQueries({ queryKey: ['matches', 'group', id] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard', id] });
      queryClient.invalidateQueries({ queryKey: ['rankings'] });
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      toast.success('Resultado guardado. Ranking actualizado.');
      router.push(`/groups/${id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'No se pudo completar la partida');
    },
  });

  const canCreateMatch = isMember && !activeMatch && allPlayers.length >= 2;
  const hasBothTeams = [0, 1].every((teamIndex) =>
    allPlayers.some((player: any) => teamAssignments[player.id] === teamIndex)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!group || !isMember) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center">
        <h1 className="text-3xl font-black text-zinc-100 mb-3">Lobby no disponible</h1>
        <p className="text-zinc-500 mb-8">Tenés que pertenecer al grupo para crear o registrar partidas.</p>
        <Link href={`/groups/${id}`}>
          <Button variant="outline">Volver al grupo</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-800 pb-8">
        <div>
          <Link href={`/groups/${id}`} className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-200 mb-4 text-sm font-bold">
            <ArrowLeftIcon className="w-4 h-4" />
            Volver al grupo
          </Link>
          <h1 className="text-4xl sm:text-6xl font-black italic uppercase tracking-tighter text-zinc-50">
            Lobby
          </h1>
          <p className="text-zinc-500 mt-2">
            Armá equipos, jugá la partida y registrá el resultado para mover el ranking de {group.name}.
          </p>
        </div>
        <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-xl">
          Sistema {group.rankingConfig?.mode?.toUpperCase() || 'ELO'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {activeMatch ? (
            <Card className="bg-zinc-900/60 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <TrophyIcon className="w-6 h-6 text-yellow-500" />
                  Registrar Resultado
                </CardTitle>
                <CardDescription>{activeMatch.name} está en curso.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {activeMatch.teams.map((team: any, index: number) => (
                    <div key={team.name} className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-black uppercase italic text-zinc-100">{team.name}</h3>
                        <Input
                          type="number"
                          min={0}
                          value={scores[index]}
                          onChange={(event) => {
                            const nextScores = [...scores];
                            nextScores[index] = Number(event.target.value);
                            setScores(nextScores);
                          }}
                          className="w-24 text-center"
                        />
                      </div>
                      <div className="space-y-2">
                        {team.players.map((player: any) => (
                          <div key={player.user._id} className="text-sm text-zinc-400 flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-black text-zinc-200">
                              {player.user.username[0].toUpperCase()}
                            </span>
                            {player.user.username}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-5">
                  <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3">
                    Resultado
                  </label>
                  <select
                    value={winner}
                    onChange={(event) => setWinner(event.target.value as '0' | '1' | 'draw')}
                    className="w-full h-12 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-zinc-100 font-bold"
                  >
                    <option value="0">Gana Equipo Azul</option>
                    <option value="1">Gana Equipo Rojo</option>
                    <option value="draw">Empate</option>
                  </select>
                </div>

                <Button
                  onClick={() => completeMatchMutation.mutate()}
                  isLoading={completeMatchMutation.isPending}
                  className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 font-black uppercase italic"
                >
                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                  Guardar resultado y actualizar ranking
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-zinc-900/60 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <PlayIcon className="w-6 h-6 text-blue-500" />
                  Crear Partida
                </CardTitle>
                <CardDescription>Configurá una partida rankeada rápida para este grupo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input label="Nombre" value={matchName} onChange={(event) => setMatchName(event.target.value)} />
                  <Input label="Juego" value={gameType} onChange={(event) => setGameType(event.target.value)} />
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <UserGroupIcon className="w-5 h-5 text-blue-500" />
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400">Equipos</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {[0, 1].map((teamIndex) => (
                      <div key={teamIndex} className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-5">
                        <h4 className="font-black uppercase italic text-zinc-100 mb-4">
                          {teamIndex === 0 ? 'Equipo Azul' : 'Equipo Rojo'}
                        </h4>
                        <div className="space-y-2">
                          {allPlayers.map((player: any) => (
                            <label key={player.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-900 cursor-pointer">
                              <input
                                type="radio"
                                name={`player-${player.id}`}
                                checked={teamAssignments[player.id] === teamIndex}
                                onChange={() => setTeamAssignments({
                                  ...teamAssignments,
                                  [player.id]: teamIndex,
                                })}
                              />
                              <span className={`text-zinc-300 font-bold ${player.type === 'guest' ? 'text-orange-400' : ''}`}>
                                {player.name}
                                {player.type === 'guest' && ' (Invitado)'}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => createMatchMutation.mutate()}
                  disabled={!canCreateMatch || !hasBothTeams || createMatchMutation.isPending}
                  isLoading={createMatchMutation.isPending}
                  className="w-full h-14 bg-blue-600 hover:bg-blue-500 font-black uppercase italic"
                >
                  Crear partida rankeada
                </Button>

                {!hasBothTeams && (
                  <p className="text-sm text-yellow-500">Cada equipo necesita al menos un jugador.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg">Historial reciente</CardTitle>
              <CardDescription>Últimas partidas completadas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {completedMatches.length === 0 ? (
                <p className="text-sm text-zinc-500">Todavía no hay partidas completadas.</p>
              ) : completedMatches.slice(0, 8).map((match: any) => (
                <div key={match._id} className="border border-zinc-800 rounded-xl p-4 bg-zinc-950/50">
                  <p className="font-black text-zinc-100 text-sm">{match.name}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {match.teams.map((team: any) => `${team.name} ${team.score}`).join(' vs ')}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
