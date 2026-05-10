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
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export default function GroupLobbyPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [matchName, setMatchName] = useState('');
  const [gameType, setGameType] = useState('');
  const [teamCount, setTeamCount] = useState(2);
  const [teamNames, setTeamNames] = useState(['Equipo Azul', 'Equipo Rojo']);
  const [teamAssignments, setTeamAssignments] = useState<Record<string, number | undefined>>({});
  const [scores, setScores] = useState<number[]>([]);
  const [winner, setWinner] = useState<number | 'draw'>(0);
  const [excludedPlayers, setExcludedPlayers] = useState<Set<string>>(new Set());
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestName, setGuestName] = useState('');

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
    setScores((currentScores) => {
      if (currentScores.length === teamCount) return currentScores;
      return Array.from({ length: teamCount }, (_, index) => currentScores[index] || 0);
    });

    if (!allPlayers.length || Object.keys(teamAssignments).length > 0) return;

    const nextAssignments: Record<string, number | undefined> = {};
    let teamIndex = 0;
    allPlayers.forEach((player: any) => {
      if (excludedPlayers.has(player.id)) return;

      nextAssignments[player.id] = teamIndex % teamCount;
      teamIndex++;
    });
    setTeamAssignments(nextAssignments);
  }, [allPlayers, teamAssignments, teamCount, excludedPlayers]);

  useEffect(() => {
    if (group && !matchName) {
      setMatchName(`${group.name} - Partida`);
    }
  }, [group, matchName]);

  useEffect(() => {
    if (group?.supportedGames && group.supportedGames.length > 0 && !gameType) {
      setGameType(group.supportedGames[0]);
    }
  }, [group, gameType]);

  const isMember = members.some((member: any) => member.user._id === user?._id);

  // Funciones para gestionar equipos dinámicamente
  const addTeam = () => {
    if (teamCount < 8) { // Límite máximo de 8 equipos
      setTeamCount(teamCount + 1);
      setTeamNames([...teamNames, `Equipo ${teamCount + 1}`]);
      setScores([...scores, 0]);
    }
  };

  const removeTeam = (indexToRemove: number) => {
    if (teamCount > 2) { // Mínimo 2 equipos
      const newTeamCount = teamCount - 1;
      const newTeamNames = teamNames.filter((_, i) => i !== indexToRemove);
      const newScores = scores.filter((_, i) => i !== indexToRemove);
      
      setTeamCount(newTeamCount);
      setTeamNames(newTeamNames);
      setScores(newScores);
      
      const nextAssignments: Record<string, number | undefined> = {};
      allPlayers.forEach((player: any) => {
        const currentAssignment = teamAssignments[player.id];
        if (currentAssignment === indexToRemove) {
          nextAssignments[player.id] = undefined;
        } else if (typeof currentAssignment === 'number' && currentAssignment > indexToRemove) {
          nextAssignments[player.id] = currentAssignment - 1;
        } else {
          nextAssignments[player.id] = currentAssignment;
        }
      });
      setTeamAssignments(nextAssignments);
    }
  };

  const togglePlayerExclusion = (playerId: string) => {
    const newExcluded = new Set(excludedPlayers);
    if (newExcluded.has(playerId)) {
      newExcluded.delete(playerId);
      // Asignar al siguiente equipo disponible
      const teamIndex = Object.keys(teamAssignments).length % teamCount;
      setTeamAssignments({ ...teamAssignments, [playerId]: teamIndex });
    } else {
      newExcluded.add(playerId);
      const newAssignments = { ...teamAssignments };
      delete newAssignments[playerId];
      setTeamAssignments(newAssignments);
    }
    setExcludedPlayers(newExcluded);
  };

  const updateTeamName = (index: number, name: string) => {
    const newTeamNames = [...teamNames];
    newTeamNames[index] = name;
    setTeamNames(newTeamNames);
  };

  const updatePlayerAssignment = (playerId: string, value: string) => {
    const nextAssignments = { ...teamAssignments };
    if (value === '') {
      delete nextAssignments[playerId];
    } else {
      nextAssignments[playerId] = parseInt(value, 10);
    }
    setTeamAssignments(nextAssignments);
  };

  const createMatchMutation = useMutation({
    mutationFn: () => {
      const teams = Array.from({ length: teamCount }, (_, teamIndex) => ({
        name: teamNames[teamIndex] || `Equipo ${teamIndex + 1}`,
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

  const createGuestMutation = useMutation({
    mutationFn: () => {
      if (!guestName.trim()) {
        throw new Error('El nombre del invitado es requerido');
      }
      if (!guestEmail.trim() && !guestPhone.trim()) {
        throw new Error('Debes proporcionar email o teléfono');
      }
      
      return apiClient.createGuest({
        group: id as string,
        name: guestName,
        email: guestEmail || undefined,
        phone: guestPhone || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests', id] });
      queryClient.refetchQueries({ queryKey: ['guests', id] });
      setGuestName('');
      setGuestEmail('');
      setGuestPhone('');
      toast.success('Invitado creado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'No se pudo crear el invitado');
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
  const selectedPlayersCount = allPlayers.filter((player: any) => teamAssignments[player.id] !== undefined).length;
  const hasBothTeams = Array.from({ length: teamCount }, (_, i) => 
    allPlayers.some((player: any) => teamAssignments[player.id] === i)
  ).every(Boolean);

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
          <Button className="bg-blue-600 hover:bg-blue-500">
            Volver al grupo
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-10 w-2 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.6)]" />
            <h1 className="text-4xl sm:text-6xl font-black text-zinc-50 italic tracking-tighter uppercase leading-none">
              Lobby de {group.name}
            </h1>
          </div>
          <p className="text-zinc-500 max-w-2xl">
            Organizá partidas competitivas, gestioná equipos y cargá resultados en tiempo real.
          </p>
        </div>
        <Link href={`/groups/${id}`}>
          <Button variant="outline" className="h-12 font-black uppercase">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Volver al grupo
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuración de partida */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <PlayIcon className="w-5 h-5 text-blue-500" />
              Nueva Partida
            </CardTitle>
            <CardDescription>Configurá los detalles de la partida</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3">
                Nombre de la partida
              </label>
              <Input
                value={matchName}
                onChange={(e) => setMatchName(e.target.value)}
                placeholder="Nombre de la partida"
                className="h-12"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3">
                Tipo de juego
              </label>
              <select
                value={gameType}
                onChange={(e) => setGameType(e.target.value)}
                disabled={!group?.supportedGames || group.supportedGames.length === 0}
                className="w-full h-12 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {group?.supportedGames && group.supportedGames.length > 0 ? (
                  group.supportedGames.map((game: string) => (
                    <option key={game} value={game}>{game}</option>
                  ))
                ) : (
                  <option value="">No hay juegos configurados</option>
                )}
              </select>
              {!group?.supportedGames || group.supportedGames.length === 0 && (
                <p className="text-[10px] text-red-400 mt-2">
                  Agrega juegos en la configuración del grupo
                </p>
              )}
            </div>

            <Button
              onClick={() => createMatchMutation.mutate()}
              isLoading={createMatchMutation.isPending}
              disabled={!canCreateMatch || selectedPlayersCount < 2 || !hasBothTeams}
              className="w-full h-14 bg-blue-600 hover:bg-blue-500 font-black uppercase italic disabled:opacity-50"
            >
              {createMatchMutation.isPending ? 'Creando...' : 'Crear Partida'}
            </Button>
            {!activeMatch && (
              <p className="text-xs text-zinc-500">
                Selecciona solo quienes participan en esta partida. Cada equipo necesita al menos un jugador.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Gestión de Guests */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <UserGroupIcon className="w-5 h-5 text-purple-500" />
              Invitar Jugadores
            </CardTitle>
            <CardDescription>Invitá jugadores temporales por email o teléfono</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3">
                Nombre del invitado *
              </label>
              <Input
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Nombre del jugador fantasma"
                className="h-12"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3">
                  Email del jugador
                </label>
                <Input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="email@ejemplo.com"
                  className="h-12"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3">
                  Teléfono del jugador
                </label>
                <Input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+54 9 1234 5678"
                  className="h-12"
                />
              </div>
            </div>
            <p className="text-[10px] text-zinc-600">
              * Campos requeridos. Debes proporcionar al menos nombre y email o teléfono.
            </p>
            <Button
              onClick={() => createGuestMutation.mutate()}
              isLoading={createGuestMutation.isPending}
              disabled={!guestName.trim() || (!guestEmail.trim() && !guestPhone.trim())}
              className="w-full h-12 bg-purple-600 hover:bg-purple-500 font-black uppercase disabled:opacity-50"
            >
              {createGuestMutation.isPending ? 'Creando...' : 'Crear Jugador Fantasma'}
            </Button>
          </CardContent>
        </Card>

        {/* Gestión de equipos */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <UserGroupIcon className="w-5 h-5 text-emerald-500" />
              Configuración de Equipos
            </CardTitle>
            <CardDescription>Administrá los equipos y sus nombres</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Control de cantidad de equipos */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3">
                Cantidad de equipos: {teamCount}
              </label>
              <div className="flex gap-2">
                <Button
                  onClick={addTeam}
                  disabled={teamCount >= 8}
                  variant="outline"
                  size="sm"
                  className="text-emerald-400 border-emerald-800 hover:bg-emerald-900/20"
                >
                  <PlusIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Nombres de equipos */}
            <div className="space-y-3">
              <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3">
                Nombres de equipos
              </label>
              {teamNames.map((name, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={name}
                    onChange={(e) => updateTeamName(index, e.target.value)}
                    placeholder={`Equipo ${index + 1}`}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => removeTeam(index)}
                    disabled={teamCount <= 2}
                    variant="outline"
                    size="sm"
                    className="text-red-400 border-red-800 hover:bg-red-900/20"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Asignación de jugadores */}
            <div className="space-y-3">
              <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3">
                Asignación de jugadores ({allPlayers.length} disponibles)
              </label>
              {Array.from({ length: teamCount }, (_, teamIndex) => (
                <div key={teamIndex} className="border border-zinc-800 rounded-xl p-4 bg-zinc-950/50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-black uppercase text-zinc-100">
                      {teamNames[teamIndex] || `Equipo ${teamIndex + 1}`}
                    </h4>
                    <span className="text-[10px] font-black text-zinc-600">
                      {allPlayers.filter((p: any) => teamAssignments[p.id] === teamIndex).length} jugadores
                    </span>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {allPlayers
                      .filter((player: any) => teamAssignments[player.id] === teamIndex)
                      .map((player: any) => (
                        <div key={player.id} className="flex items-center justify-between text-sm bg-zinc-800 rounded px-3 py-2 gap-2">
                          <span className="text-zinc-100 flex-1">{player.name}</span>
                          <span className="text-[10px] text-zinc-600">
                            {player.type === 'guest' ? '(Invitado)' : '(Miembro)'}
                          </span>
                          <select
                            value={teamAssignments[player.id]}
                            onChange={(e) => {
                              const newAssignments = { ...teamAssignments };
                              newAssignments[player.id] = parseInt(e.target.value);
                              setTeamAssignments(newAssignments);
                            }}
                            className="text-xs bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-zinc-300"
                          >
                            {Array.from({ length: teamCount }, (_, i) => (
                              <option key={i} value={i}>
                                {teamNames[i] || `Equipo ${i + 1}`}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => togglePlayerExclusion(player.id)}
                            className="text-zinc-500 hover:text-red-400 transition-colors"
                            title="Eliminar del partido"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Jugadores excluidos del partido */}
            {excludedPlayers.size > 0 && (
              <div className="mt-4 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-red-400">
                    Jugadores excluidos ({excludedPlayers.size})
                  </label>
                </div>
                <div className="space-y-1">
                  {allPlayers
                    .filter((player: any) => excludedPlayers.has(player.id))
                    .map((player: any) => (
                      <div key={player.id} className="flex items-center justify-between text-sm bg-zinc-900 rounded px-3 py-2 gap-2">
                        <span className="text-zinc-400 flex-1">{player.name}</span>
                        <span className="text-[10px] text-zinc-600">
                          {player.type === 'guest' ? '(Invitado)' : '(Miembro)'}
                        </span>
                        <button
                          onClick={() => togglePlayerExclusion(player.id)}
                          className="text-emerald-500 hover:text-emerald-400 transition-colors text-xs font-black"
                        >
                          + Agregar
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Partida activa */}
      {activeMatch && (
        <Card className="bg-zinc-900/50 border-zinc-800 border-blue-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <TrophyIcon className="w-5 h-5 text-yellow-500" />
              Partida en curso: {activeMatch.name}
            </CardTitle>
            <CardDescription>Cargá el resultado cuando finalice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: teamCount }, (_, teamIndex) => (
                <div key={teamIndex}>
                  <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3">
                    Puntaje - {teamNames[teamIndex] || `Equipo ${teamIndex + 1}`}
                  </label>
                  <Input
                    type="number"
                    value={scores[teamIndex] || 0}
                    onChange={(e) => {
                      const newScores = [...scores];
                      newScores[teamIndex] = parseInt(e.target.value) || 0;
                      setScores(newScores);
                    }}
                    placeholder="0"
                    className="h-12"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3">
                Resultado
              </label>
              <select
                value={winner}
                onChange={(e) => setWinner(e.target.value as number | 'draw')}
                className="w-full h-12 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-zinc-100 font-bold"
              >
                {Array.from({ length: teamCount }, (_, teamIndex) => (
                  <option key={teamIndex} value={teamIndex}>
                    Gana {teamNames[teamIndex] || `Equipo ${teamIndex + 1}`}
                  </option>
                ))}
                <option value="draw">Empate</option>
              </select>
            </div>

            <Button
              onClick={() => completeMatchMutation.mutate()}
              isLoading={completeMatchMutation.isPending}
              className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 font-black uppercase italic"
            >
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              {completeMatchMutation.isPending ? 'Guardando...' : 'Cargar Resultado'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
