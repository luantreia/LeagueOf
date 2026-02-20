'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { 
  PlusIcon, 
  UsersIcon, 
  GlobeAltIcon, 
  LockClosedIcon, 
  TrophyIcon, 
  ChevronRightIcon,
  IdentificationIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export default function GroupsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'joined' | 'explore'>('joined');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinHandle, setJoinHandle] = useState('');

  const [newGroup, setNewGroup] = useState({
    name: '',
    handle: '',
    description: '',
    isPublic: true,
    rankingMode: 'elo'
  });

  const { data, isLoading } = useQuery({
    queryKey: ['groups', activeTab],
    queryFn: () => apiClient.getGroups({ filter: activeTab }),
  });

  const createMutation = useMutation({
    mutationFn: (groupData: any) => apiClient.createGroup(groupData),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setIsModalOpen(false);
      setNewGroup({ name: '', handle: '', description: '', isPublic: true, rankingMode: 'elo' });
      toast.success('¡Grupo creado con éxito!');
      router.push(`/groups/${response.data._id}`);
    },
    onError: (error: any) => {
      const backendMessage = error.response?.data?.message;
      toast.error(backendMessage || 'Error al crear el grupo');
    },
  });

  const joinByHandleMutation = useMutation({
    mutationFn: (handle: string) => apiClient.joinGroupByHandle(handle),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setIsJoinModalOpen(false);
      setJoinHandle('');
      toast.success('¡Te has unido correctamente!');
      router.push(`/groups/${response.data._id}`);
    },
    onError: (error: any) => {
      const backendMessage = error.response?.data?.message;
      toast.error(backendMessage || 'No se pudo unir al grupo');
    },
  });

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newGroup);
  };

  const handleJoinByHandle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinHandle.trim()) return;
    joinByHandleMutation.mutate(joinHandle);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
          <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
        </div>
      </div>
    );
  }

  const groups = data?.data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-12 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
             <div className="h-10 w-2 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.6)]" />
             <h1 className="text-4xl sm:text-6xl font-black text-zinc-50 italic tracking-tighter uppercase leading-none">
               Grupos y Ligas
             </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => setActiveTab('joined')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${
                activeTab === 'joined' 
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Mis Grupos
            </button>
            <button 
              onClick={() => setActiveTab('explore')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${
                activeTab === 'explore' 
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Explorar Públicos
            </button>
          </div>
        </div>
        
        {user && (
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <Button 
              onClick={() => setIsJoinModalOpen(true)}
              variant="outline"
              className="flex-1 sm:flex-none h-16 border-zinc-800 text-zinc-400 hover:border-zinc-100 hover:text-zinc-100 font-black italic uppercase tracking-widest px-8 rounded-2xl transition-all flex items-center justify-center gap-3"
            >
              <IdentificationIcon className="w-5 h-5" />
              Unirme por @Handle
            </Button>
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="flex-1 sm:flex-none h-16 bg-blue-600 hover:bg-blue-500 text-zinc-50 font-black italic uppercase tracking-widest px-10 rounded-2xl shadow-2xl shadow-blue-600/20 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-3"
            >
              <PlusIcon className="w-6 h-6" />
              Crear Grupo
            </Button>
          </div>
        )}
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {groups.map((group: any) => (
          <Link key={group._id} href={`/groups/${group._id}`}>
            <Card className="group bg-zinc-900/40 border-zinc-800/50 hover:border-blue-500/50 transition-all duration-500 overflow-hidden cursor-pointer hover:shadow-2xl hover:shadow-blue-500/5 backdrop-blur-sm h-full flex flex-col">
              <CardContent className="p-0 flex-1 flex flex-col">
                <div className="p-8 space-y-6 flex-1">
                  <div className="flex justify-between items-start">
                    <div className="h-14 w-14 bg-zinc-950 rounded-2xl border-2 border-zinc-800 flex items-center justify-center font-black text-2xl text-zinc-100 group-hover:border-blue-500/50 group-hover:scale-110 group-hover:-rotate-3 transition-all shadow-xl">
                      {group.name ? group.name[0].toUpperCase() : '?'}
                    </div>
                    {group.settings?.isPublic ? (
                      <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                        <GlobeAltIcon className="w-3 h-3" /> Público
                      </div>
                    ) : (
                      <div className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                        <LockClosedIcon className="w-3 h-3" /> Privado
                      </div>
                    )}
                  </div>

                  <div>
                     <div className="flex flex-col mb-2">
                       <h3 className="text-2xl font-black text-zinc-50 uppercase italic tracking-tighter group-hover:text-blue-400 transition-colors leading-none">
                         {group.name}
                       </h3>
                       <span className="text-[10px] font-black text-blue-500/50 uppercase tracking-[0.2em] mt-1">
                         @{group.handle}
                       </span>
                     </div>
                     <p className="text-zinc-500 text-sm line-clamp-2 leading-relaxed min-h-[2.5rem]">
                       {group.description || "Sin descripción de combate..."}
                     </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-950/50 border border-zinc-800/50 p-3 rounded-xl flex items-center gap-4 group-hover:bg-zinc-950 transition-colors hover:shadow-inner">
                      <UsersIcon className="w-5 h-5 text-blue-500" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Huestes</span>
                        <span className="text-lg font-black text-zinc-100 italic">{group.members?.length || 0}</span>
                      </div>
                    </div>
                    <div className="bg-zinc-950/50 border border-zinc-800/50 p-3 rounded-xl flex items-center gap-4 group-hover:bg-zinc-950 transition-colors hover:shadow-inner">
                      <TrophyIcon className="w-5 h-5 text-yellow-500" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Capitán</span>
                        <span className="text-sm font-black text-zinc-100 italic uppercase truncate max-w-[80px]">
                          {group.owner?.username || 'Sistema'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900 border-t border-zinc-800/50 p-5 flex items-center justify-between group-hover:bg-blue-600/[0.03] transition-colors">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] italic">Ver Detalles del Nexo</span>
                  <ChevronRightIcon className="w-4 h-4 text-zinc-600 group-hover:translate-x-1 group-hover:text-blue-500 transition-all" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {groups.length === 0 && (
          <div className="col-span-full py-40 flex flex-col items-center justify-center text-center bg-zinc-900/20 border-2 border-dashed border-zinc-800 rounded-3xl">
             <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-3xl mb-8 shadow-2xl">
               <UsersIcon className="w-16 h-16 text-zinc-700" />
             </div>
             <h3 className="text-2xl font-black text-zinc-400 italic uppercase tracking-widest mb-2">
               {activeTab === 'joined' ? 'Tierras Vacantes' : 'Sin Nuevos Mundos'}
             </h3>
             <p className="text-zinc-600 max-w-xs text-sm uppercase font-bold tracking-tight">
               {activeTab === 'joined' 
                 ? 'No perteneces a ningún grupo todavía. Explora grupos públicos o crea el tuyo.'
                 : 'No hay más grupos públicos por descubrir en este momento.'}
             </p>
          </div>
        )}
      </div>

      {/* Modal Unirme por @Handle */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 bg-zinc-950/90 backdrop-blur-xl z-50 flex items-center justify-center p-6 animate-in fade-in transition-all">
          <Card className="w-full max-w-lg bg-zinc-900 border-zinc-800 shadow-2xl rounded-[2rem] overflow-hidden">
             <div className="p-10 space-y-8">
               <div className="text-center space-y-2">
                 <h2 className="text-3xl font-black text-zinc-50 uppercase italic tracking-tighter">Acceso Directo</h2>
                 <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Ingresa el @handle del grupo</p>
               </div>

               <form onSubmit={handleJoinByHandle} className="space-y-6">
                 <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                     <span className="text-blue-500 font-black text-xl">@</span>
                   </div>
                   <input
                     type="text"
                     autoFocus
                     className="w-full pl-12 pr-6 py-5 bg-zinc-950 border border-zinc-800 rounded-2xl text-zinc-100 font-bold placeholder:text-zinc-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg"
                     placeholder="nombre-del-grupo"
                     value={joinHandle}
                     onChange={(e) => setJoinHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                   />
                 </div>

                 <div className="flex gap-4">
                   <Button 
                     type="button"
                     variant="ghost"
                     onClick={() => { setIsJoinModalOpen(false); setJoinHandle(''); }}
                     className="flex-1 py-7 rounded-2xl font-black uppercase tracking-widest text-[10px] text-zinc-500 hover:text-zinc-100"
                   >
                     Cancelar
                   </Button>
                   <Button 
                     type="submit"
                     disabled={joinByHandleMutation.isPending}
                     className="flex-[2] bg-blue-600 hover:bg-blue-500 py-7 rounded-2xl font-black italic uppercase tracking-widest shadow-xl border-b-4 border-blue-900 active:border-b-0 active:translate-y-1 transition-all"
                   >
                     {joinByHandleMutation.isPending ? 'SOLICITANDO...' : 'UNIRME AL GRUPO'}
                   </Button>
                 </div>
               </form>
             </div>
          </Card>
        </div>
      )}

      {/* Modal de Creación */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-zinc-950/90 backdrop-blur-xl z-50 flex items-center justify-center p-6 animate-in fade-in transition-all">
          <Card className="w-full max-w-2xl bg-zinc-900 border-zinc-800 shadow-2xl rounded-[2rem] overflow-hidden flex flex-col md:flex-row lg:max-h-[85vh]">
            {/* Lado Decorativo */}
            <div className="hidden md:flex md:w-1/3 bg-blue-600 p-10 flex-col justify-between items-start relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
               <div className="relative z-10">
                 <h2 className="text-4xl font-black text-zinc-50 italic uppercase tracking-tighter leading-tight mb-4">
                   Nuevo<br />Grupo
                 </h2>
                 <p className="text-blue-100/60 font-black uppercase text-[10px] tracking-widest">Define el destino de tu servidor</p>
               </div>
               <PlusIcon className="w-20 h-20 text-blue-500/30 self-end -mb-4 -mr-4 drop-shadow-2xl" />
            </div>

            <div className="flex-1 p-8 md:p-12">
              <form onSubmit={handleCreateGroup} className="space-y-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Input
                      label="Nombre del Grupo"
                      required
                      minLength={3}
                      value={newGroup.name}
                      onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                      placeholder="Ej: HIGH ELO LEGENDS"
                    />
                    <Input
                      label="Etiqueta @Handle"
                      required
                      minLength={3}
                      value={newGroup.handle}
                      onChange={(e) => setNewGroup({ ...newGroup, handle: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                      placeholder="ej: heroes-de-lol"
                    />
                  </div>
                  
                  <div className="w-full">
                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3 ml-1 italic">Manifiesto (Opcional)</label>
                    <textarea
                      className="w-full px-6 py-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-zinc-100 font-bold placeholder:text-zinc-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm leading-relaxed"
                      rows={4}
                      value={newGroup.description}
                      onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                      placeholder="Propósito y reglas de la comunidad..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Visibilidad</label>
                      <div className="flex bg-zinc-950 p-1.5 border border-zinc-800 rounded-2xl gap-2">
                        <button
                          type="button"
                          onClick={() => setNewGroup({ ...newGroup, isPublic: true })}
                          className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            newGroup.isPublic 
                              ? 'bg-zinc-800 text-blue-400 shadow-xl border border-zinc-700/50' 
                              : 'text-zinc-600 hover:text-zinc-400'
                          }`}
                        >
                          🌐 Público
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewGroup({ ...newGroup, isPublic: false })}
                          className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            !newGroup.isPublic 
                              ? 'bg-zinc-800 text-blue-400 shadow-xl border border-zinc-700/50' 
                              : 'text-zinc-600 hover:text-zinc-400'
                          }`}
                        >
                          🔒 Privado
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Sistema de Ranking</label>
                      <div className="flex bg-zinc-950 p-1.5 border border-zinc-800 rounded-2xl gap-2">
                        <button
                          type="button"
                          onClick={() => setNewGroup({ ...newGroup, rankingMode: 'elo' })}
                          className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            newGroup.rankingMode === 'elo' 
                              ? 'bg-zinc-800 text-blue-400 shadow-xl border border-zinc-700/50' 
                              : 'text-zinc-600 hover:text-zinc-400'
                          }`}
                        >
                          🏆 ELO
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewGroup({ ...newGroup, rankingMode: 'points' })}
                          className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            newGroup.rankingMode === 'points' 
                              ? 'bg-zinc-800 text-blue-400 shadow-xl border border-zinc-700/50' 
                              : 'text-zinc-600 hover:text-zinc-400'
                          }`}
                        >
                          🏅 PTS
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button 
                    type="button"
                    variant="ghost"
                    size="lg"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-7 rounded-2xl font-black uppercase tracking-widest text-[10px] text-zinc-500 hover:bg-zinc-800/50 transition-all"
                  >
                    Abortar
                  </Button>
                  <Button 
                    type="submit"
                    size="lg"
                    disabled={createMutation.isPending}
                    className="flex-[2] bg-blue-600 hover:bg-blue-500 py-7 rounded-2xl font-black italic uppercase tracking-widest border-b-4 border-blue-900 shadow-xl active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50"
                  >
                    {createMutation.isPending ? 'FORGEANDO...' : 'INICIALIZAR GRUPO'}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
