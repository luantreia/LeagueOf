'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/api-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  TrophyIcon, 
  UserGroupIcon, 
  MapIcon, 
  Cog6ToothIcon, 
  FireIcon, 
  ShieldCheckIcon,
  GlobeAltIcon,
  LockClosedIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

export default function GroupDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['group', id],
    queryFn: () => apiClient.getGroup(id as string),
    enabled: !!id,
  });

  const { data: leaderboardResponse } = useQuery({
    queryKey: ['leaderboard', id],
    queryFn: () => apiClient.getLeaderboard(id as string),
    enabled: !!id,
  });

  const joinMutation = useMutation({
    mutationFn: () => apiClient.joinGroup(id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      toast.success('¡Te has unido al grupo con éxito!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al unirse al grupo');
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-500 font-mono text-xs uppercase tracking-widest animate-pulse">Cargando Datos del Nexo...</p>
      </div>
    );
  }

  if (error || !response?.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-red-500/10 p-6 rounded-full mb-6">
          <MapIcon className="w-16 h-16 text-red-500" />
        </div>
        <h2 className="text-3xl font-black text-white mb-2 italic uppercase">Fuera de Mapa</h2>
        <p className="text-gray-400 mb-8 max-w-md">El grupo que buscas ya no existe o ha sido movido a otra dimensión.</p>
        <Link href="/groups">
          <Button variant="outline" className="px-8 border-gray-700 hover:border-blue-500">
            Explorar otros grupos
          </Button>
        </Link>
      </div>
    );
  }

  const group = response.data;
  const rankings = leaderboardResponse?.data?.rankings || [];
  const isOwner = user?._id === (group.owner?._id || group.owner); // Support both populated and ID
  const isMember = group.members?.some((m: any) => (m.user?._id || m.user) === user?._id);
  const isPublic = group.settings?.isPublic;

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      {/* Hero Header Heroico */}
      <div className="relative overflow-hidden rounded-[2rem] bg-zinc-900 border border-zinc-800 p-8 md:p-14 shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-500/5 to-transparent pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none opacity-50" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-2xl shadow-2xl shadow-blue-500/20 group hover:scale-105 transition-transform">
                <UserGroupIcon className="w-10 h-10 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Comunidad Elite</span>
                  {isPublic ? (
                    <span className="flex items-center gap-1 text-[9px] bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 font-black uppercase tracking-tighter shadow-sm">
                      <GlobeAltIcon className="w-3 h-3" /> Público
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[9px] bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full border border-amber-500/20 font-black uppercase tracking-tighter shadow-sm">
                      <LockClosedIcon className="w-3 h-3" /> Privado
                    </span>
                  )}
                </div>
                <h1 className="text-4xl sm:text-6xl font-black text-zinc-50 italic tracking-tighter uppercase leading-none">{group.name}</h1>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 ml-1">
              <span className="text-blue-500 font-black font-mono text-lg tracking-tighter">@{group.handle}</span>
              <div className="hidden sm:block w-1 h-1 bg-zinc-700 rounded-full" />
              <p className="text-zinc-400 text-sm font-medium max-w-xl leading-relaxed">
                {group.description || 'Una asociación de invocadores forjada en la batalla, lista para dominar la Grieta.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {isOwner && (
              <Link href={`/groups/${id}/settings`} className="w-full sm:w-auto">
                <Button variant="outline" className="w-full border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/50 gap-3 h-14 px-8 rounded-2xl transition-all">
                  <Cog6ToothIcon className="w-5 h-5 text-zinc-400" /> 
                  <span className="text-zinc-300 font-bold uppercase tracking-widest text-xs">Ajustes</span>
                </Button>
              </Link>
            )}
            
            {!isMember ? (
              <Button 
                onClick={() => joinMutation.mutate()}
                isLoading={joinMutation.isPending}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white gap-3 h-14 px-10 rounded-2xl shadow-2xl shadow-blue-600/30 text-lg font-black uppercase italic tracking-wider group transition-all"
              >
                ⚔️ Unirse al Grupo
                <div className="w-2 h-2 bg-white rounded-full animate-ping opacity-50" />
              </Button>
            ) : (
              <Link href={`/groups/${id}/lobby`} className="w-full sm:w-auto">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white gap-3 h-14 px-10 rounded-2xl shadow-2xl shadow-emerald-600/30 text-lg font-black uppercase italic tracking-wider group transition-all">
                  ⚡ Crear Lobby
                  <PlusIcon className="w-5 h-5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Content: Leaderboard */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-baseline justify-between px-2">
             <div className="flex items-center gap-4">
                <div className="h-8 w-1.5 bg-yellow-500 rounded-full shadow-lg shadow-yellow-500/50" />
                <h2 className="text-3xl font-black text-zinc-50 italic tracking-tight uppercase">Leaderboard</h2>
             </div>
             <div className="bg-zinc-900 border border-zinc-800 rounded-full px-5 py-2 text-[10px] font-black text-zinc-500 tracking-[0.1em] shadow-inner">
               SISTEMA: <span className="text-blue-400 font-mono italic">{group.rankingConfig?.mode?.toUpperCase() || 'ELO'}</span>
             </div>
          </div>

          <Card className="bg-zinc-900/40 border-zinc-800/50 shadow-2xl backdrop-blur-sm">
            <CardContent className="p-0">
              {!rankings || rankings.length === 0 ? (
                <div className="py-32 text-center">
                  <div className="relative inline-block mb-8">
                    <FireIcon className="w-16 h-16 text-zinc-800 mx-auto" />
                    <div className="absolute top-0 left-0 w-full h-full bg-blue-500/10 blur-2xl animate-pulse" />
                  </div>
                  <p className="font-black italic uppercase text-zinc-100 tracking-widest text-xl">Sin historial de combate</p>
                  <p className="text-zinc-500 text-sm mt-2 max-w-xs mx-auto">Inicia un lobby y completa victorias para reclamar tu lugar en el podio.</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/30">
                  {rankings.map((entry: any, index: number) => (
                    <div 
                      key={entry._id} 
                      className={`flex items-center justify-between p-7 transition-all group hover:bg-zinc-50/5 ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-500/[0.03] to-transparent' : ''
                      }`}
                    >
                      <div className="flex items-center gap-8">
                        <div className={`text-4xl font-black italic w-12 text-center transition-all group-hover:scale-110 ${
                          index === 0 ? 'text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]' :
                          index === 1 ? 'text-zinc-300' :
                          index === 2 ? 'text-amber-700' : 'text-zinc-800'
                        }`}>
                          {index + 1}
                        </div>
                        
                        <div className="relative">
                          <div className={`w-16 h-16 rounded-2xl bg-zinc-950 border-2 flex items-center justify-center font-black text-2xl text-zinc-100 transition-all group-hover:-rotate-3 group-hover:border-blue-500 ${
                            index === 0 ? 'border-yellow-500 shadow-2xl shadow-yellow-500/20' : 'border-zinc-800'
                          }`}>
                            {entry.user.username[0].toUpperCase()}
                          </div>
                          {index === 0 && (
                            <div className="absolute -top-3 -right-3 bg-yellow-500 rounded-xl p-2 shadow-2xl rotate-12">
                              <TrophyIcon className="w-4 h-4 text-zinc-950" />
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col">
                          <span className="font-black text-2xl text-zinc-100 group-hover:text-blue-400 transition-colors uppercase italic tracking-tighter leading-none mb-1">
                            {entry.user.username}
                          </span>
                          <span className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                             Veteranía <span className="w-1 h-1 bg-zinc-700 rounded-full" /> {new Date(entry.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-baseline gap-2 justify-end">
                           <span className={`text-5xl font-black font-mono italic tracking-tighter transition-all group-hover:scale-105 ${
                             index === 0 ? 'text-yellow-500 drop-shadow-sm' : 'text-blue-500'
                           }`}>
                             {group.rankingConfig?.mode === 'elo' ? entry.elo?.rating : entry.points?.total}
                           </span>
                           <span className="text-xs font-black text-zinc-600 uppercase tracking-tighter italic">
                             {group.rankingConfig?.mode === 'elo' ? 'ELO' : 'PTS'}
                           </span>
                        </div>
                        <div className="flex gap-3 justify-end mt-2">
                           <div className="text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-md font-black uppercase tracking-widest">WINSTREAK: {entry.stats?.wins || 0}</div>
                           <div className="text-[9px] bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded-md font-black uppercase tracking-widest">LOSS: {entry.stats?.losses || 0}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Space */}
        <div className="space-y-10">
           {/* Estadísticas de Grupo */}
           <div className="space-y-5">
              <h3 className="text-xs font-black text-zinc-600 uppercase tracking-[0.3em] ml-3 italic">Registros del Nexo</h3>
              <Card className="bg-zinc-900 border-zinc-800 shadow-2xl overflow-hidden rounded-3xl">
                <CardContent className="p-0">
                  <div className="p-6 border-b border-zinc-800/50 flex justify-between items-center group hover:bg-zinc-800/40 transition-all cursor-default">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                        <UserGroupIcon className="w-5 h-5 text-blue-400" />
                      </div>
                      <span className="text-[11px] font-black text-zinc-500 uppercase tracking-wider">Huestes Actuales</span>
                    </div>
                    <span className="text-2xl font-black text-zinc-100 italic">{group.members?.length || 0}</span>
                  </div>
                  
                  <div className="p-6 border-b border-zinc-800/50 flex justify-between items-center group hover:bg-zinc-800/40 transition-all cursor-default">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-orange-500/10 rounded-xl group-hover:bg-orange-500/20 transition-colors text-orange-400">
                        <FireIcon className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-black text-zinc-500 uppercase tracking-wider">Conflictos Totales</span>
                    </div>
                    <span className="text-2xl font-black text-zinc-100 italic">{group.stats?.totalMatches || 0}</span>
                  </div>

                  <div className="p-6 flex justify-between items-center group bg-blue-600/[0.03] hover:bg-blue-600/[0.08] transition-all cursor-default">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
                        <ShieldCheckIcon className="w-5 h-5 text-emerald-400" />
                      </div>
                      <span className="text-[11px] font-black text-zinc-500 uppercase tracking-wider">Altos Inquisidores</span>
                    </div>
                    <span className="text-xs font-black text-emerald-400 uppercase italic tracking-tight">@{group.owner?.username}</span>
                  </div>
                </CardContent>
              </Card>
           </div>

           {/* Miembros / Online (?) */}
           <div className="space-y-5">
              <h3 className="text-xs font-black text-zinc-600 uppercase tracking-[0.3em] ml-3 italic">Miembros Activos</h3>
              <div className="flex flex-wrap gap-3 px-2">
                {group.members?.slice(0, 15).map((m: any) => (
                  <div 
                    key={m.user._id} 
                    title={m.user.username}
                    className="relative group h-12 w-12"
                  >
                    <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative h-12 w-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-sm font-black text-zinc-500 group-hover:text-blue-400 group-hover:border-blue-500/50 group-hover:-translate-y-1 transition-all cursor-pointer shadow-lg shadow-black/40">
                      {m.user.username[0].toUpperCase()}
                    </div>
                  </div>
                ))}
                {group.members?.length > 15 && (
                  <div className="h-12 w-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-600">
                    +{group.members.length - 15}
                  </div>
                )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
