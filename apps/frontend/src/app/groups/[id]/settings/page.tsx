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
  TrashIcon
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

  useEffect(() => {
    if (response?.data) {
        const group = response.data;
        setFormData({
            name: group.name,
            handle: group.handle,
            description: group.description || '',
            isPublic: group.settings?.isPublic ?? true,
        });
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
          <div className="p-4 bg-blue-600/10 text-blue-400 rounded-2xl border border-blue-500/20 flex items-center gap-3 font-black uppercase italic text-xs tracking-wider">
            <Cog6ToothIcon className="w-5 h-5 shadow-blue-500/50" />
            <span>Perfil del Grupo</span>
          </div>
          <div className="p-4 text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300 rounded-2xl transition-all flex items-center gap-3 cursor-not-allowed opacity-40 font-bold uppercase italic text-xs tracking-wider">
            <ShieldCheckIcon className="w-5 h-5" />
            <span>Roles y Miembros</span>
          </div>
          <div className="p-4 text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300 rounded-2xl transition-all flex items-center gap-3 cursor-not-allowed opacity-40 font-bold uppercase italic text-xs tracking-wider">
            <TrophyIcon className="w-5 h-5" />
            <span>Ajustes de Ranking</span>
          </div>
          <div className="pt-6 mt-6 border-t border-zinc-900">
             <button className="w-full p-4 text-red-500/70 hover:bg-red-500/10 hover:text-red-500 rounded-2xl transition-all flex items-center gap-3 font-black uppercase italic text-xs tracking-wider">
              <TrashIcon className="w-5 h-5" />
              <span>Eliminar Grupo</span>
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="lg:col-span-3 space-y-8">
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

          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6 flex gap-5 items-start">
            <div className="p-3 bg-yellow-500/10 rounded-xl">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="font-black text-yellow-500 uppercase italic tracking-widest text-sm mb-1">Zona de riesgo</p>
              <p className="text-xs text-zinc-400 font-medium leading-relaxed">Cambiar el <span className="text-yellow-500/80 font-bold">@handle</span> invalidará permanentemente todos los enlaces de invitación compartidos previamente.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
