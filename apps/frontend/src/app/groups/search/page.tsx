'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MagnifyingGlassIcon, UserGroupIcon, TrophyIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function GroupSearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [gameType, setGameType] = useState('');
  const [page, setPage] = useState(1);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['group-search', searchQuery, gameType, page],
    queryFn: () => apiClient.searchGroups(searchQuery, gameType || undefined, page, 20),
    enabled: true,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleJoin = async (groupId: string) => {
    try {
      await apiClient.joinGroup(groupId);
      toast.success('Solicitud enviada');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al unirse al grupo');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 px-4 sm:px-6 py-12 lg:px-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-2 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.6)]" />
            <h1 className="text-3xl sm:text-5xl font-black text-zinc-50 italic tracking-tighter uppercase leading-none">
              Buscar Grupos
            </h1>
          </div>
          <p className="text-zinc-500 font-bold uppercase tracking-[0.18em] text-[10px] sm:text-xs">
            Encuentra grupos públicos para unirte
          </p>
        </header>

        <Card className="bg-zinc-900/40 border-zinc-800">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <Input
                  type="text"
                  placeholder="Buscar por nombre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 pl-12 h-12"
                />
              </div>
              <Input
                type="text"
                placeholder="Filtrar por juego..."
                value={gameType}
                onChange={(e) => setGameType(e.target.value)}
                className="bg-zinc-950 border-zinc-800 h-12"
              />
              <Button type="submit" className="bg-blue-600 hover:bg-blue-500 h-12">
                Buscar
              </Button>
            </form>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12 text-zinc-500">Cargando...</div>
        ) : searchResults?.data?.groups && searchResults.data.groups.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.data.groups.map((group: any) => (
                <Card key={group._id} className="bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-xl uppercase italic text-zinc-100">{group.name}</CardTitle>
                    <CardDescription className="text-zinc-400">@{group.handle}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {group.description && (
                      <p className="text-sm text-zinc-400 line-clamp-2">{group.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <div className="flex items-center gap-1">
                        <UserGroupIcon className="w-4 h-4" />
                        <span>{group.members?.length || 0} miembros</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrophyIcon className="w-4 h-4" />
                        <span>{group.stats?.totalMatches || 0} partidas</span>
                      </div>
                    </div>
                    {group.supportedGames && group.supportedGames.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {group.supportedGames.slice(0, 3).map((game: string) => (
                          <span key={game} className="px-2 py-1 bg-zinc-800 rounded text-[10px] font-black uppercase tracking-wider text-zinc-400">
                            {game}
                          </span>
                        ))}
                        {group.supportedGames.length > 3 && (
                          <span className="px-2 py-1 bg-zinc-800 rounded text-[10px] font-black uppercase tracking-wider text-zinc-400">
                            +{group.supportedGames.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Link href={`/groups/${group._id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          Ver
                        </Button>
                      </Link>
                      <Button
                        onClick={() => handleJoin(group._id)}
                        className="flex-1 bg-blue-600 hover:bg-blue-500"
                      >
                        Unirse
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {searchResults.data.total > 20 && (
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <span className="flex items-center text-zinc-400">
                  Página {page}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * 20 >= searchResults.data.total}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <MagnifyingGlassIcon className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
            <p className="text-zinc-500 font-bold uppercase tracking-wider">
              No se encontraron grupos
            </p>
            <p className="text-zinc-600 text-sm mt-2">
              Intenta con otros términos de búsqueda
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
