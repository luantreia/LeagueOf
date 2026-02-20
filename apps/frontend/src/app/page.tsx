'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  TrophyIcon, 
  BoltIcon, 
  UserGroupIcon, 
  ArrowRightIcon, 
  BellIcon,
  PlayIcon,
  ChartBarIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]"></div>
          <div className="absolute inset-0 bg-blue-600/20 blur-2xl rounded-full" />
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-zinc-950 px-4 sm:px-6 py-12 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <header className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                 <div className="h-10 w-2 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.6)]" />
                 <h1 className="text-3xl sm:text-5xl font-black text-zinc-50 italic tracking-tighter uppercase leading-none">
                   Nexus <span className="text-blue-500">Dashboard</span>
                 </h1>
              </div>
              <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-[10px] sm:text-xs ml-0 sm:ml-6">
                Bienvenido de vuelta, <span className="text-zinc-100 italic">@{user.username}</span>. Preparado para el despliegue?
              </p>
            </div>
            <div className="flex bg-zinc-900/50 border border-zinc-800 p-2 rounded-2xl backdrop-blur-sm w-full md:w-auto">
               <div className="flex-1 px-4 sm:px-6 py-3 text-center border-r border-zinc-800">
                  <span className="block text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Victorias</span>
                  <span className="text-2xl font-black text-emerald-500 italic leading-none">{user.stats.totalWins}</span>
               </div>
               <div className="flex-1 px-4 sm:px-6 py-3 text-center">
                  <span className="block text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Winrate</span>
                  <span className="text-2xl font-black text-blue-500 italic leading-none">
                    {user.stats.totalMatches > 0 
                      ? Math.round((user.stats.totalWins / user.stats.totalMatches) * 100) 
                      : 0}%
                  </span>
               </div>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
             <Card className="bg-zinc-900/40 border-zinc-800 hover:border-blue-500/50 transition-all p-8 flex flex-col justify-between group cursor-default shadow-2xl">
                <div className="h-12 w-12 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 transition-transform">
                   <ChartBarIcon className="w-6 h-6" />
                </div>
                <div>
                   <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] italic">Partidas Totales</span>
                   <p className="text-4xl font-black text-zinc-100 italic mt-1">{user.stats.totalMatches}</p>
                </div>
             </Card>
             <Card className="bg-zinc-900/40 border-zinc-800 hover:border-emerald-500/50 transition-all p-8 flex flex-col justify-between group cursor-default">
                <div className="h-12 w-12 bg-emerald-600/10 rounded-xl flex items-center justify-center text-emerald-500 mb-6 group-hover:scale-110 transition-transform">
                   <TrophyIcon className="w-6 h-6" />
                </div>
                <div>
                   <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] italic">Victorias de Campo</span>
                   <p className="text-4xl font-black text-zinc-100 italic mt-1">{user.stats.totalWins}</p>
                </div>
             </Card>
             <Card className="bg-zinc-900/40 border-zinc-800 hover:border-red-500/50 transition-all p-8 flex flex-col justify-between group cursor-default">
                <div className="h-12 w-12 bg-red-600/10 rounded-xl flex items-center justify-center text-red-500 mb-6 group-hover:scale-110 transition-transform">
                   <BoltIcon className="w-6 h-6" />
                </div>
                <div>
                   <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] italic">Derrotas Críticas</span>
                   <p className="text-4xl font-black text-zinc-100 italic mt-1">{user.stats.totalLosses}</p>
                </div>
             </Card>
             <Card className="bg-zinc-900/40 border-zinc-800 hover:border-zinc-500 transition-all p-8 flex items-center justify-center group cursor-pointer text-zinc-600 hover:text-zinc-100 transition-colors">
                <div className="text-center">
                   <PlusIcon className="w-8 h-8 mx-auto mb-2 opacity-20 group-hover:opacity-100" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Ver Stats Detalladas</span>
                </div>
             </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
               <div className="flex items-center gap-4 mb-2">
                  <h2 className="text-2xl font-black text-zinc-100 italic tracking-tighter uppercase leading-none">Acceso <span className="text-blue-500">Rápido</span></h2>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <Button className="group h-32 bg-zinc-900 border-zinc-800 hover:border-blue-500/50 flex items-center justify-between p-8 rounded-[2rem] shadow-2xl active:translate-y-1 transition-all overflow-hidden relative" variant="outline">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl -mr-16 -mt-16" />
                   <div className="relative text-left flex flex-col items-start gap-1">
                      <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] italic">Combate</span>
                      <span className="text-2xl font-black text-zinc-100 uppercase italic tracking-tighter">Buscar Lobby</span>
                   </div>
                   <PlayIcon className="w-10 h-10 text-blue-500 group-hover:scale-125 transition-all" />
                 </Button>

                 <Link href="/groups" className="block">
                   <Button className="group h-32 w-full bg-zinc-900 border-zinc-800 hover:border-blue-500/50 flex items-center justify-between p-8 rounded-[2rem] shadow-2xl active:translate-y-1 transition-all overflow-hidden relative" variant="outline">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl -mr-16 -mt-16" />
                     <div className="relative text-left flex flex-col items-start gap-1">
                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] italic">Comunidad</span>
                        <span className="text-2xl font-black text-zinc-100 uppercase italic tracking-tighter">Mis Grupos</span>
                     </div>
                     <UserGroupIcon className="w-10 h-10 text-blue-500 group-hover:scale-125 transition-all" />
                   </Button>
                 </Link>

                 <Button className="group h-32 bg-zinc-900 border-zinc-800 hover:border-blue-500/50 flex items-center justify-between p-8 rounded-[2rem] shadow-2xl active:translate-y-1 transition-all overflow-hidden relative" variant="outline">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl -mr-16 -mt-16" />
                   <div className="relative text-left flex flex-col items-start gap-1">
                      <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] italic">Clasificación</span>
                      <span className="text-2xl font-black text-zinc-100 uppercase italic tracking-tighter">Rankings Globales</span>
                   </div>
                   <TrophyIcon className="w-10 h-10 text-blue-500 group-hover:scale-125 transition-all" />
                 </Button>

                 <Button className="group h-32 bg-indigo-600 hover:bg-indigo-500 flex items-center justify-between p-8 rounded-[2rem] shadow-2xl shadow-indigo-600/20 active:translate-y-1 transition-all border-b-4 border-indigo-800 active:border-b-0 overflow-hidden relative" variant="primary">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                   <div className="relative text-left flex flex-col items-start gap-1">
                      <span className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.3em] italic">Ajustes</span>
                      <span className="text-2xl font-black text-zinc-50 uppercase italic tracking-tighter">Perfil de Usuario</span>
                   </div>
                   <ArrowRightIcon className="w-10 h-10 text-zinc-50 group-hover:translate-x-2 transition-all" />
                 </Button>
               </div>
            </div>

            <div className="space-y-8">
               <div className="flex items-center gap-4 mb-2">
                  <h2 className="text-2xl font-black text-zinc-100 italic tracking-tighter uppercase leading-none">Nexos <span className="text-blue-500">Recientes</span></h2>
               </div>
               <Card className="bg-zinc-900/40 border-zinc-800 p-8 rounded-[2rem] flex flex-col items-center justify-center text-center py-20 border-dashed">
                  <div className="w-20 h-20 bg-zinc-950 border border-zinc-800 rounded-3xl flex items-center justify-center text-zinc-700 mb-6 drop-shadow-2xl">
                    <BellIcon className="w-10 h-10 opacity-20" />
                  </div>
                  <h3 className="text-xl font-black text-zinc-300 uppercase italic tracking-tighter mb-2">Sin actividad crítica</h3>
                  <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest max-w-[200px] leading-loose">Te avisaremos cuando detectemos incursiones o invitaciones de grupo.</p>
               </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 overflow-hidden relative selection:bg-blue-500/30">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] -mr-[400px] -mt-[400px] animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[100px] -ml-[300px] -mb-[300px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />

      <div className="container mx-auto px-6 py-32 lg:py-48 relative z-10">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-3 px-5 py-2 mb-10 text-[10px] font-black tracking-[0.3em] text-blue-400 uppercase bg-blue-950/40 border border-blue-500/20 rounded-full italic backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Operaciones de Temporada 2026 Activas
          </div>
          
          <h1 className="text-6xl sm:text-8xl md:text-[10rem] font-black text-zinc-100 mb-8 tracking-tighter leading-[0.85] italic uppercase select-none">
            LEAGUE <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 drop-shadow-[0_0_35px_rgba(37,99,235,0.3)]">OF</span>
          </h1>
          
          <p className="text-lg md:text-2xl text-zinc-500 mb-14 font-bold leading-relaxed max-w-2xl uppercase tracking-tighter">
            La arquitectura definitiva para el comando de <span className="text-zinc-100">rankings de elo</span>, gestión de grupos y despliegue de <span className="text-zinc-100">lobbies competitivos</span>.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 mb-24">
            <Link href="/auth/register" className="w-full sm:w-auto">
              <Button size="lg" className="h-20 w-full sm:px-12 text-zinc-50 bg-blue-600 hover:bg-blue-500 font-black italic uppercase tracking-[0.2em] text-base rounded-2xl shadow-2xl shadow-blue-600/30 border-b-4 border-blue-900 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-4 group">
                Iniciar Alistamiento
                <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </Button>
            </Link>
            <Link href="/auth/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="h-20 w-full sm:px-12 bg-zinc-900/50 border-zinc-800 text-zinc-100 hover:bg-zinc-800 font-black italic uppercase tracking-[0.2em] text-base rounded-2xl backdrop-blur-sm transition-all shadow-xl">
                Acceso de Veterano
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            <div className="group space-y-4">
               <div className="h-14 w-14 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 group-hover:-rotate-3 transition-all shadow-xl">
                 <TrophyIcon className="w-7 h-7" />
               </div>
               <h3 className="text-lg font-black text-zinc-100 uppercase italic tracking-widest tracking-tighter">Sistemas ELO-9</h3>
               <p className="text-zinc-500 text-sm font-bold uppercase tracking-tight leading-relaxed">Algoritmos de ranking dinámicos basados en la arquitectura del ajedrez profesional.</p>
            </div>
            
            <div className="group space-y-4 md:border-l md:border-zinc-900 md:pl-10">
               <div className="h-14 w-14 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:scale-110 group-hover:-rotate-3 transition-all shadow-xl">
                 <BoltIcon className="w-7 h-7" />
               </div>
               <h3 className="text-lg font-black text-zinc-100 uppercase italic tracking-widest tracking-tighter">Despliegue Instantáneo</h3>
               <p className="text-zinc-500 text-sm font-bold uppercase tracking-tight leading-relaxed">Interacción en milisegundos para lobbies y notificaciones de combate en vivo.</p>
            </div>

            <div className="group space-y-4 md:border-l md:border-zinc-900 md:pl-10">
               <div className="h-14 w-14 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:scale-110 group-hover:-rotate-3 transition-all shadow-xl">
                 <UserGroupIcon className="w-7 h-7" />
               </div>
               <h3 className="text-lg font-black text-zinc-100 uppercase italic tracking-widest tracking-tighter">Comandos de Grupo</h3>
               <p className="text-zinc-500 text-sm font-bold uppercase tracking-tight leading-relaxed">Crea facciones privadas con reglamentos y rankings de honor personalizados.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Decoration */}
      <div className="absolute bottom-0 w-full p-10 flex justify-between items-center opacity-30 select-none">
         <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.5em]">PROTOCOLO v2.0.26</span>
         <div className="flex gap-10">
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">DIRECTIVA DE PRIVACIDAD</span>
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">CÓDIGO DE HONOR</span>
         </div>
      </div>
    </div>
  );
}
