'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    username: user?.username || '',
    email: user?.email || '',
  });

  const { data: stats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => apiClient.getUserStats(),
    enabled: !!user,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: typeof formData) => apiClient.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Perfil actualizado correctamente');
      setIsEditing(false);
    },
    onError: () => {
      toast.error('Error al actualizar el perfil');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 sm:px-6 py-12 lg:px-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-2 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.6)]" />
            <h1 className="text-3xl sm:text-5xl font-black text-zinc-50 italic tracking-tighter uppercase leading-none">
              Mi Perfil
            </h1>
          </div>
          <p className="text-zinc-500 font-bold uppercase tracking-[0.18em] text-[10px] sm:text-xs">
            Gestiona tu informacion personal y estadisticas
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-zinc-900/40 border-zinc-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-zinc-100">Informacion Personal</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? 'Cancelar' : 'Editar'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="displayName">Nombre de Visualizacion</Label>
                        <Input
                          id="displayName"
                          value={formData.displayName}
                          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>
                      <div>
                        <Label htmlFor="username">Usuario</Label>
                        <Input
                          id="username"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-500"
                      >
                        {updateProfileMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">
                          Nombre de Visualizacion
                        </p>
                        <p className="text-zinc-100 font-black uppercase italic">{user.displayName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">
                          Usuario
                        </p>
                        <p className="text-zinc-100 font-black uppercase italic">@{user.username}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">
                        Email
                      </p>
                      <p className="text-zinc-100">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">
                        Miembro desde
                      </p>
                      <p className="text-zinc-100">
                        {user.createdAt ? 
                          new Date(user.createdAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          }) : 
                          'Informacion no disponible'
                        }
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-zinc-900/40 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-zinc-100">Estadisticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-black text-blue-400">
                      {stats?.data?.totalMatches || user?.stats?.totalMatches || 0}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                      Partidas
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-emerald-400">
                      {stats?.data?.totalWins || user?.stats?.totalWins || 0}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                      Victorias
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-red-400">
                      {stats?.data?.totalLosses || user?.stats?.totalLosses || 0}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                      Derrotas
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-yellow-400">
                      {stats?.data?.winRate || 
                        Math.round(
                          ((user?.stats?.totalWins || 0) / (user?.stats?.totalMatches || 1)) * 100
                        )
                      }%
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                      Win Rate
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/40 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-zinc-100">Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  Cambiar Contraseña
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Configuracion de Privacidad
                </Button>
                <Button variant="outline" className="w-full justify-start text-red-400 border-red-800 hover:bg-red-900/20">
                  Cerrar Sesion
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
