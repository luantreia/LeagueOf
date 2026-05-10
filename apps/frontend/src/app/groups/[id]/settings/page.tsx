'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/api-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  ChevronLeftIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
  TrophyIcon,
  TrashIcon,
  UserPlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function GroupSettingsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    handle: '',
    description: '',
    isPublic: true,
  });

  const [guestForm, setGuestForm] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [activeSection, setActiveSection] = useState<'profile' | 'members' | 'ranking' | 'games'>('profile');

  const [rankingConfig, setRankingConfig] = useState({
    mode: 'elo' as 'elo' | 'points',
    eloSettings: {
      kFactor: 32,
      initialRating: 1200,
      minRating: 0,
    },
    pointsSettings: {
      winPoints: 3,
      lossPoints: -1,
      drawPoints: 1,
    },
  });

  const [newGame, setNewGame] = useState('');

  const { data: response, isLoading } = useQuery({
    queryKey: ['group', id],
    queryFn: () => apiClient.getGroup(id as string),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiClient.updateGroup(id as string, data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      toast.success('¡Cambios guardados!');
      // Si el handle cambió, redirigimos suavemente (aunque el backend use IDs)
      setFormData({
        name: res.data.name,
        handle: res.data.handle,
        description: res.data.description || '',
        isPublic: res.data.settings?.isPublic ?? true,
      });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Error al actualizar el grupo';
      toast.error(msg);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.deleteGroup(id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.removeQueries({ queryKey: ['group', id] });
      toast.success('Grupo eliminado');
      router.push('/groups');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Error al eliminar el grupo';
      toast.error(msg);
    },
  });

  const { data: guestsResponse } = useQuery({
    queryKey: ['guests', id],
    queryFn: () => apiClient.getGuestsByGroup(id as string),
    enabled: !!id,
  });

  const createGuestMutation = useMutation({
    mutationFn: (data: any) => apiClient.createGuest({ ...data, group: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests', id] });
      toast.success('Invitado creado exitosamente');
      setGuestForm({ name: '', email: '', phone: '' });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Error al crear invitado';
      toast.error(msg);
    },
  });

  const deleteGuestMutation = useMutation({
    mutationFn: (guestId: string) => apiClient.deleteGuest(guestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests', id] });
      toast.success('Invitado eliminado');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Error al eliminar invitado';
      toast.error(msg);
    },
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      apiClient.updateMemberRole(id as string, memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      toast.success('Rol actualizado');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Error al actualizar rol';
      toast.error(msg);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => apiClient.removeMember(id as string, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      toast.success('Miembro expulsado');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Error al expulsar miembro';
      toast.error(msg);
    },
  });

  const updateRankingConfigMutation = useMutation({
    mutationFn: (config: any) => apiClient.updateRankingConfig(id as string, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      toast.success('Configuración de ranking actualizada');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Error al actualizar configuración';
      toast.error(msg);
    },
  });

  const resetRankingsMutation = useMutation({
    mutationFn: () => apiClient.resetRankings(id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaderboard', id] });
      toast.success('Rankings reseteados');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Error al resetear rankings';
      toast.error(msg);
    },
  });

  const addSupportedGameMutation = useMutation({
    mutationFn: (game: string) => apiClient.addSupportedGame(id as string, game),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      toast.success('Juego agregado');
      setNewGame('');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Error al agregar juego';
      toast.error(msg);
    },
  });

  const removeSupportedGameMutation = useMutation({
    mutationFn: (game: string) => apiClient.removeSupportedGame(id as string, game),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      toast.success('Juego eliminado');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Error al eliminar juego';
      toast.error(msg);
    },
  });

  useEffect(() => {
    if (response?.data) {
        const group = response.data;
        setFormData({
            name: group.name,
            handle: group.handle,
            description: group.description || '',
            isPublic: group.settings?.isPublic ?? true,
        });
        if (group.rankingConfig) {
            setRankingConfig({
                mode: group.rankingConfig.mode || 'elo',
                eloSettings: group.rankingConfig.eloSettings || {
                    kFactor: 32,
                    initialRating: 1200,
                    minRating: 0,
                },
                pointsSettings: group.rankingConfig.pointsSettings || {
                    winPoints: 3,
                    lossPoints: -1,
                    drawPoints: 1,
                },
            });
        }
    }
  }, [response]);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  );

  const group = response?.data;
  
  if (!group || user?._id !== group.owner?._id) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="bg-red-500/10 p-4 rounded-full mb-6">
              <ShieldCheckIcon className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Acceso Denegado</h2>
            <p className="text-gray-400 mb-8 max-w-md">No tienes los permisos necesarios para gestionar la configuración de este grupo.</p>
            <Link href={`/groups/${id}`}>
                <Button variant="outline" className="gap-2">
                  <ChevronLeftIcon className="w-4 h-4" /> Volver al Grupo
                </Button>
            </Link>
        </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleDelete = () => {
    const confirmed = window.confirm(`Eliminar "${group.name}"? Esta accion no se puede deshacer.`);
    if (!confirmed) return;
    deleteMutation.mutate();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Estilizado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <Link href={`/groups/${id}`}>
            <div className="p-2 hover:bg-zinc-800 rounded-full transition-colors cursor-pointer group">
              <ChevronLeftIcon className="w-6 h-6 text-zinc-500 group-hover:text-zinc-100" />
            </div>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Cog6ToothIcon className="w-5 h-5 text-blue-500" />
              <span className="text-blue-500 font-bold uppercase tracking-widest text-[10px]">Gestión de Comunidad</span>
            </div>
            <h1 className="text-4xl font-black text-zinc-50 tracking-tight uppercase italic">Configuración</h1>
          </div>
        </div>
        
        <div className="flex gap-3">
           <Button 
            onClick={handleSave} 
            isLoading={updateMutation.isPending}
            className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase italic px-10 shadow-lg shadow-blue-500/20 py-6"
          >
            Guardar Cambios
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <div 
            onClick={() => setActiveSection('profile')}
            className={`p-4 rounded-2xl transition-all flex items-center gap-3 font-black uppercase italic text-xs tracking-wider cursor-pointer ${
              activeSection === 'profile'
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
            }`}
          >
            <Cog6ToothIcon className="w-5 h-5" />
            <span>Perfil del Grupo</span>
          </div>
          <div 
            onClick={() => setActiveSection('members')}
            className={`p-4 rounded-2xl transition-all flex items-center gap-3 font-black uppercase italic text-xs tracking-wider cursor-pointer ${
              activeSection === 'members'
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
            }`}
          >
            <ShieldCheckIcon className="w-5 h-5" />
            <span>Roles y Miembros</span>
          </div>
          <div 
            onClick={() => setActiveSection('ranking')}
            className={`p-4 rounded-2xl transition-all flex items-center gap-3 font-black uppercase italic text-xs tracking-wider cursor-pointer ${
              activeSection === 'ranking'
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
            }`}
          >
            <TrophyIcon className="w-5 h-5" />
            <span>Ajustes de Ranking</span>
          </div>
          <div 
            onClick={() => setActiveSection('games')}
            className={`p-4 rounded-2xl transition-all flex items-center gap-3 font-black uppercase italic text-xs tracking-wider cursor-pointer ${
              activeSection === 'games'
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
            }`}
          >
            <TrophyIcon className="w-5 h-5" />
            <span>Juegos Soportados</span>
          </div>
          <div className="pt-6 mt-6 border-t border-zinc-900">
             <button
              type="button"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="w-full p-4 text-red-500/70 hover:bg-red-500/10 hover:text-red-500 rounded-2xl transition-all flex items-center gap-3 font-black uppercase italic text-xs tracking-wider disabled:opacity-50 disabled:cursor-wait"
            >
              <TrashIcon className="w-5 h-5" />
              <span>{deleteMutation.isPending ? 'Eliminando...' : 'Eliminar Grupo'}</span>
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="lg:col-span-3 space-y-8">
          {activeSection === 'profile' && (
            <>
          <Card className="bg-zinc-900/60 border-zinc-800 shadow-2xl">
            <CardHeader className="border-b border-zinc-800/50 mb-6 bg-zinc-800/20">
              <CardTitle className="text-xl uppercase italic">Identidad</CardTitle>
              <CardDescription className="text-zinc-400">Define cómo se presentará tu comunidad al resto de jugadores.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                    <label className="text-[11px] font-black text-zinc-500 ml-1 uppercase tracking-[0.2em]">Nombre Visible</label>
                    <Input 
                        placeholder="Ej: Solo Mid Masters"
                        value={formData.name}
                        className="h-12 bg-zinc-950/80"
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                    <p className="text-[10px] text-zinc-500 italic ml-1">Visible en el buscador de grupos.</p>
                </div>

                <div className="space-y-3">
                    <label className="text-[11px] font-black text-zinc-500 ml-1 uppercase tracking-[0.2em]">Identificador Único</label>
                    <div className="relative">
                        <span className="absolute left-4 top-3.5 text-blue-500 font-black">@</span>
                        <input 
                            className="w-full pl-9 pr-4 h-12 bg-zinc-950/80 border border-zinc-800 rounded-xl text-zinc-100 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                            value={formData.handle}
                            onChange={(e) => setFormData({...formData, handle: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')})}
                        />
                    </div>
                    <p className="text-[10px] text-zinc-500 italic ml-1 font-medium">Único para compartir enlaces directos.</p>
                </div>
              </div>

              <div className="space-y-3">
                  <label className="text-[11px] font-black text-zinc-500 ml-1 uppercase tracking-[0.2em]">Misión y Reglas</label>
                  <textarea 
                      className="w-full px-5 py-4 bg-zinc-950/80 border border-zinc-800 rounded-xl text-zinc-200 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 min-h-[140px] transition-all placeholder-zinc-700"
                      placeholder="Escribe algo sobre tu grupo, reglas, etc..."
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                  <p className="text-[10px] text-zinc-600 ml-1 uppercase tracking-widest font-bold">Procura ser claro y directo.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/40 border-zinc-800 shadow-2xl">
            <CardHeader className="border-b border-zinc-800/50 mb-6 bg-zinc-800/10">
              <CardTitle className="text-xl uppercase italic">Filtro de Reclutamiento</CardTitle>
              <CardDescription className="text-zinc-400 font-medium">Controla quién tiene el honor de unirse a tus filas.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isPublic: true })}
                  className={`p-6 rounded-2xl border-2 transition-all flex flex-col gap-3 items-start text-left group ${
                    formData.isPublic
                      ? 'border-blue-600 bg-blue-600/5 ring-1 ring-blue-500/50 shadow-lg shadow-blue-500/10'
                      : 'border-zinc-800 bg-zinc-950/40 hover:bg-zinc-800/40 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${formData.isPublic ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                      <GlobeAltIcon className="w-5 h-5" />
                    </div>
                    <span className={`font-black uppercase italic tracking-wider ${formData.isPublic ? 'text-zinc-50' : 'text-zinc-500'}`}>Legión Abierta</span>
                  </div>
                  <p className={`text-xs leading-relaxed ${formData.isPublic ? 'text-zinc-300' : 'text-zinc-600'}`}>Cualquier invocador puede unirse de inmediato sin aprobación previa.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isPublic: false })}
                  className={`p-6 rounded-2xl border-2 transition-all flex flex-col gap-3 items-start text-left group ${
                    !formData.isPublic
                      ? 'border-blue-600 bg-blue-600/5 ring-1 ring-blue-500/50 shadow-lg shadow-blue-500/10'
                      : 'border-zinc-800 bg-zinc-950/40 hover:bg-zinc-800/40 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${!formData.isPublic ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                      <LockClosedIcon className="w-5 h-5" />
                    </div>
                    <span className={`font-black uppercase italic tracking-wider ${!formData.isPublic ? 'text-zinc-50' : 'text-zinc-500'}`}>Orden Privada</span>
                  </div>
                  <p className={`text-xs leading-relaxed ${!formData.isPublic ? 'text-zinc-300' : 'text-zinc-600'}`}>Solo aquellos con invitación directa pueden cruzar el portal de tu comunidad.</p>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/60 border-zinc-800 shadow-2xl">
            <CardHeader className="border-b border-zinc-800/50 mb-6 bg-zinc-800/20">
              <CardTitle className="text-xl uppercase italic flex items-center gap-2">
                <UserPlusIcon className="w-5 h-5" />
                Invitados Temporales
              </CardTitle>
              <CardDescription className="text-zinc-400">Crea cuentas temporales para jugadores sin registro en la app.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Formulario para crear guest */}
              <div className="p-6 bg-zinc-950/60 rounded-2xl border border-zinc-800">
                <h3 className="text-sm font-black text-zinc-300 uppercase tracking-wider mb-4">Nuevo Invitado</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    placeholder="Nombre"
                    value={guestForm.name}
                    onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                    className="bg-zinc-900 border-zinc-800"
                  />
                  <Input
                    placeholder="Email (opcional)"
                    type="email"
                    value={guestForm.email}
                    onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
                    className="bg-zinc-900 border-zinc-800"
                  />
                  <Input
                    placeholder="Teléfono (opcional)"
                    value={guestForm.phone}
                    onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                    className="bg-zinc-900 border-zinc-800"
                  />
                </div>
                <Button
                  onClick={() => createGuestMutation.mutate(guestForm)}
                  disabled={!guestForm.name || createGuestMutation.isPending}
                  className="mt-4 bg-blue-600 hover:bg-blue-500"
                >
                  {createGuestMutation.isPending ? 'Creando...' : 'Crear Invitado'}
                </Button>
              </div>

              {/* Lista de guests */}
              {guestsResponse?.data && guestsResponse.data.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-black text-zinc-300 uppercase tracking-wider">Invitados Activos</h3>
                  {guestsResponse.data.map((guest: any) => (
                    <div
                      key={guest._id}
                      className="flex items-center justify-between p-4 bg-zinc-950/40 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                          <UserPlusIcon className="w-5 h-5 text-zinc-500" />
                        </div>
                        <div>
                          <p className="font-bold text-zinc-100">{guest.name}</p>
                          <div className="flex gap-3 text-xs text-zinc-500">
                            {guest.email && <span>{guest.email}</span>}
                            {guest.phone && <span>{guest.phone}</span>}
                            {!guest.email && !guest.phone && <span>Sin contacto</span>}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('¿Eliminar este invitado?')) {
                            deleteGuestMutation.mutate(guest._id);
                          }
                        }}
                        disabled={deleteGuestMutation.isPending}
                        className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {guestsResponse?.data && guestsResponse.data.length === 0 && (
                <div className="text-center py-8 text-zinc-500">
                  <UserPlusIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No hay invitados en este grupo</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6 flex gap-5 items-start">
            <div className="p-3 bg-yellow-500/10 rounded-xl">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="font-black text-yellow-500 uppercase italic tracking-widest text-sm mb-1">Zona de riesgo</p>
              <p className="text-xs text-zinc-400 font-medium leading-relaxed">Cambiar el <span className="text-yellow-500/80 font-bold">@handle</span> invalidará permanentemente todos los enlaces de invitación compartidos previamente.</p>
            </div>
          </div>
            </>
          )}

          {activeSection === 'members' && (
            <>
              <Card className="bg-zinc-900/60 border-zinc-800 shadow-2xl">
                <CardHeader className="border-b border-zinc-800/50 mb-6 bg-zinc-800/20">
                  <CardTitle className="text-xl uppercase italic">Roles y Miembros</CardTitle>
                  <CardDescription className="text-zinc-400">Gestiona los roles y permisos de los miembros de tu comunidad.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {group.members?.map((member: any) => (
                    <div key={member.user._id} className="flex items-center justify-between p-4 bg-zinc-950/40 rounded-xl border border-zinc-800">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center font-black text-zinc-300">
                          {member.user.username[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-100">{member.user.username}</p>
                          <p className="text-xs text-zinc-500">{member.user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <select
                          value={member.role || 'member'}
                          onChange={(e) => {
                            updateMemberRoleMutation.mutate({
                              memberId: member.user._id,
                              role: e.target.value,
                            });
                          }}
                          className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300"
                          disabled={member.user._id === group.owner._id || updateMemberRoleMutation.isPending}
                        >
                          <option value="owner">Owner</option>
                          <option value="admin">Admin</option>
                          <option value="moderator">Moderador</option>
                          <option value="member">Miembro</option>
                        </select>
                        {member.user._id !== group.owner._id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`¿Expulsar a ${member.user.username}?`)) {
                                removeMemberMutation.mutate(member.user._id);
                              }
                            }}
                            disabled={removeMemberMutation.isPending}
                            className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!group.members || group.members.length === 0) && (
                    <div className="text-center py-8 text-zinc-500">
                      <ShieldCheckIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No hay miembros en este grupo</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {activeSection === 'ranking' && (
            <>
              <Card className="bg-zinc-900/60 border-zinc-800 shadow-2xl">
                <CardHeader className="border-b border-zinc-800/50 mb-6 bg-zinc-800/20">
                  <CardTitle className="text-xl uppercase italic">Ajustes de Ranking</CardTitle>
                  <CardDescription className="text-zinc-400">Configura el sistema de rankings y puntuación de tu comunidad.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-zinc-500 ml-1 uppercase tracking-[0.2em]">Sistema de Ranking</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setRankingConfig({ ...rankingConfig, mode: 'elo' });
                          updateRankingConfigMutation.mutate({ ...rankingConfig, mode: 'elo' });
                        }}
                        disabled={updateRankingConfigMutation.isPending}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          rankingConfig.mode === 'elo'
                            ? 'border-blue-600 bg-blue-600/5'
                            : 'border-zinc-800 bg-zinc-950/40 hover:bg-zinc-800/40'
                        }`}
                      >
                        <p className="font-bold text-zinc-100">ELO</p>
                        <p className="text-xs text-zinc-500 mt-1">Sistema de rating dinámico</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRankingConfig({ ...rankingConfig, mode: 'points' });
                          updateRankingConfigMutation.mutate({ ...rankingConfig, mode: 'points' });
                        }}
                        disabled={updateRankingConfigMutation.isPending}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          rankingConfig.mode === 'points'
                            ? 'border-blue-600 bg-blue-600/5'
                            : 'border-zinc-800 bg-zinc-950/40 hover:bg-zinc-800/40'
                        }`}
                      >
                        <p className="font-bold text-zinc-100">Puntos</p>
                        <p className="text-xs text-zinc-500 mt-1">Sistema acumulativo</p>
                      </button>
                    </div>
                  </div>

                  {rankingConfig.mode === 'elo' && (
                    <div className="space-y-4 p-4 bg-zinc-950/40 rounded-xl border border-zinc-800">
                      <h3 className="font-bold text-zinc-300 uppercase tracking-wider text-sm">Configuración ELO</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block mb-2">K-Factor</label>
                          <Input
                            type="number"
                            value={rankingConfig.eloSettings.kFactor}
                            onChange={(e) => setRankingConfig({
                              ...rankingConfig,
                              eloSettings: { ...rankingConfig.eloSettings, kFactor: parseInt(e.target.value) },
                            })}
                            onBlur={() => updateRankingConfigMutation.mutate(rankingConfig)}
                            className="bg-zinc-900 border-zinc-800"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block mb-2">Rating Inicial</label>
                          <Input
                            type="number"
                            value={rankingConfig.eloSettings.initialRating}
                            onChange={(e) => setRankingConfig({
                              ...rankingConfig,
                              eloSettings: { ...rankingConfig.eloSettings, initialRating: parseInt(e.target.value) },
                            })}
                            onBlur={() => updateRankingConfigMutation.mutate(rankingConfig)}
                            className="bg-zinc-900 border-zinc-800"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block mb-2">Rating Mínimo</label>
                          <Input
                            type="number"
                            value={rankingConfig.eloSettings.minRating}
                            onChange={(e) => setRankingConfig({
                              ...rankingConfig,
                              eloSettings: { ...rankingConfig.eloSettings, minRating: parseInt(e.target.value) },
                            })}
                            onBlur={() => updateRankingConfigMutation.mutate(rankingConfig)}
                            className="bg-zinc-900 border-zinc-800"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {rankingConfig.mode === 'points' && (
                    <div className="space-y-4 p-4 bg-zinc-950/40 rounded-xl border border-zinc-800">
                      <h3 className="font-bold text-zinc-300 uppercase tracking-wider text-sm">Configuración de Puntos</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block mb-2">Puntos Victoria</label>
                          <Input
                            type="number"
                            value={rankingConfig.pointsSettings.winPoints}
                            onChange={(e) => setRankingConfig({
                              ...rankingConfig,
                              pointsSettings: { ...rankingConfig.pointsSettings, winPoints: parseInt(e.target.value) },
                            })}
                            onBlur={() => updateRankingConfigMutation.mutate(rankingConfig)}
                            className="bg-zinc-900 border-zinc-800"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block mb-2">Puntos Derrota</label>
                          <Input
                            type="number"
                            value={rankingConfig.pointsSettings.lossPoints}
                            onChange={(e) => setRankingConfig({
                              ...rankingConfig,
                              pointsSettings: { ...rankingConfig.pointsSettings, lossPoints: parseInt(e.target.value) },
                            })}
                            onBlur={() => updateRankingConfigMutation.mutate(rankingConfig)}
                            className="bg-zinc-900 border-zinc-800"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block mb-2">Puntos Empate</label>
                          <Input
                            type="number"
                            value={rankingConfig.pointsSettings.drawPoints}
                            onChange={(e) => setRankingConfig({
                              ...rankingConfig,
                              pointsSettings: { ...rankingConfig.pointsSettings, drawPoints: parseInt(e.target.value) },
                            })}
                            onBlur={() => updateRankingConfigMutation.mutate(rankingConfig)}
                            className="bg-zinc-900 border-zinc-800"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                    <h3 className="font-bold text-red-500 uppercase tracking-wider text-sm mb-2">Zona de Peligro</h3>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (confirm('¿Estás seguro de resetear todos los rankings? Esta acción no se puede deshacer.')) {
                          resetRankingsMutation.mutate();
                        }
                      }}
                      disabled={resetRankingsMutation.isPending}
                      className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                    >
                      {resetRankingsMutation.isPending ? 'Reseteando...' : 'Resetear Todos los Rankings'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeSection === 'games' && (
            <>
              <Card className="bg-zinc-900/60 border-zinc-800 shadow-2xl">
                <CardHeader className="border-b border-zinc-800/50 mb-6 bg-zinc-800/20">
                  <CardTitle className="text-xl uppercase italic">Juegos Soportados</CardTitle>
                  <CardDescription className="text-zinc-400">Define qué juegos se pueden jugar en este grupo.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Formulario para agregar juego */}
                  <div className="p-6 bg-zinc-950/60 rounded-2xl border border-zinc-800">
                    <h3 className="text-sm font-black text-zinc-300 uppercase tracking-wider mb-4">Agregar Juego</h3>
                    <div className="flex gap-3">
                      <Input
                        placeholder="Ej: League of Legends"
                        value={newGame}
                        onChange={(e) => setNewGame(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newGame.trim()) {
                            addSupportedGameMutation.mutate(newGame.trim());
                          }
                        }}
                        className="bg-zinc-900 border-zinc-800"
                      />
                      <Button
                        onClick={() => newGame.trim() && addSupportedGameMutation.mutate(newGame.trim())}
                        disabled={!newGame.trim() || addSupportedGameMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-500"
                      >
                        {addSupportedGameMutation.isPending ? 'Agregando...' : 'Agregar'}
                      </Button>
                    </div>
                  </div>

                  {/* Lista de juegos */}
                  {group.supportedGames && group.supportedGames.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-black text-zinc-300 uppercase tracking-wider">Juegos Activos</h3>
                      {group.supportedGames.map((game: string) => (
                        <div
                          key={game}
                          className="flex items-center justify-between p-4 bg-zinc-950/40 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors"
                        >
                          <span className="font-bold text-zinc-100">{game}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`¿Eliminar ${game}?`)) {
                                removeSupportedGameMutation.mutate(game);
                              }
                            }}
                            disabled={removeSupportedGameMutation.isPending}
                            className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                          >
                            <XMarkIcon className="w-5 h-5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {(!group.supportedGames || group.supportedGames.length === 0) && (
                    <div className="text-center py-8 text-zinc-500">
                      <TrophyIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No hay juegos soportados</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
