'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const { data: notificationsResponse, isLoading } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: () => apiClient.getNotifications({ 
      ...(filter !== 'all' && { status: filter }) 
    }),
    enabled: !!user,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => apiClient.markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notificacion marcada como leida');
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiClient.markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Todas las notificaciones marcadas como leidas');
    },
  });

  const notifications = notificationsResponse?.data || [];
  const unreadCount = notifications.filter((n: any) => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'match_invite':
        return <div className="w-2 h-2 bg-blue-500 rounded-full" />;
      case 'match_result':
        return <div className="w-2 h-2 bg-emerald-500 rounded-full" />;
      case 'group_invite':
        return <div className="w-2 h-2 bg-purple-500 rounded-full" />;
      default:
        return <div className="w-2 h-2 bg-zinc-500 rounded-full" />;
    }
  };

  const getNotificationMessage = (notification: any) => {
    switch (notification.type) {
      case 'match_invite':
        return `Has sido invitado a una partida en ${notification.data?.groupName || 'un grupo'}`;
      case 'match_result':
        return `Resultado de partida: ${notification.data?.result || 'Disponible'}`;
      case 'group_invite':
        return `Has sido invitado a unirte al grupo ${notification.data?.groupName || ''}`;
      default:
        return notification.message || notification.title || 'Notificacion';
    }
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
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-2 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.6)]" />
              <h1 className="text-3xl sm:text-5xl font-black text-zinc-50 italic tracking-tighter uppercase leading-none">
                Notificaciones
              </h1>
            </div>
            <p className="text-zinc-500 font-bold uppercase tracking-[0.18em] text-[10px] sm:text-xs">
              {unreadCount > 0 && `${unreadCount} notificaciones sin leer`}
            </p>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
              className="shrink-0"
            >
              <CheckIcon className="w-4 h-4 mr-2" />
              Marcar todas como leidas
            </Button>
          )}
        </header>

        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Todas
          </Button>
          <Button
            variant={filter === 'unread' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            No leidas
          </Button>
          <Button
            variant={filter === 'read' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('read')}
          >
            Leidas
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-2 text-zinc-500">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600"></div>
              Cargando notificaciones...
            </div>
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notification: any) => (
              <Card
                key={notification._id}
                className={`bg-zinc-900/40 border-zinc-800 transition-all ${
                  !notification.read ? 'border-blue-500/30 bg-blue-950/20' : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-zinc-100 font-medium mb-1">
                          {getNotificationMessage(notification)}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                          {new Date(notification.createdAt).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification._id)}
                        disabled={markAsReadMutation.isPending}
                        className="shrink-0"
                      >
                        <CheckIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-zinc-900/40 border-zinc-800 border-dashed">
            <CardContent className="p-12 text-center">
              <BellIcon className="w-12 h-12 mx-auto mb-4 text-zinc-600 opacity-30" />
              <p className="text-zinc-500 font-medium mb-2">
                {filter === 'unread' ? 'No hay notificaciones sin leer' : 'No hay notificaciones'}
              </p>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                Las notificaciones apareceran aqui cuando tengas actividad nueva
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
