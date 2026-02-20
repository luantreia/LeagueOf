'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from './ui/button';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'CAMPOS DE BATALLA', href: '/matches' },
    { name: 'RANKINGS', href: '/rankings' },
    { name: 'GRUPOS', href: '/groups' },
  ];

  return (
    <nav className="bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/50 fixed w-full z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center gap-12">
            <Link href="/" className="group flex items-center gap-3">
              <div className="h-8 w-1.5 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.6)] group-hover:h-10 transition-all" />
              <span className="text-xl sm:text-2xl font-black italic tracking-tighter text-zinc-50 uppercase select-none group-hover:text-blue-500 transition-colors">
                LEAGUE <span className="text-blue-600 group-hover:text-zinc-50 transition-colors">OF</span>
              </span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => {
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link 
                    key={link.href}
                    href={link.href} 
                    className={`text-[10px] font-black tracking-[0.2em] transition-all relative py-2 ${
                      isActive 
                        ? 'text-zinc-50' 
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {link.name}
                    {isActive && (
                      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.8)]" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Desktop User Actions */}
          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <div className="flex items-center gap-6">
                <div className="flex flex-col text-right">
                  <span className="text-[10px] font-black text-zinc-50 uppercase tracking-widest leading-none mb-1 italic">
                    {user.username}
                  </span>
                  <span className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.1em] flex items-center gap-1 justify-end">
                    <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" /> Nivel 32
                  </span>
                </div>
                
                <div className="relative group">
                   <div className="absolute inset-0 bg-blue-600/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                   <div className="relative h-11 w-11 rounded-xl bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center text-zinc-100 font-black text-lg transition-all group-hover:border-blue-500 group-hover:-rotate-3 overflow-hidden shadow-2xl">
                     {user.username[0].toUpperCase()}
                   </div>
                </div>

                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={logout}
                  className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl px-4 h-10 transition-all"
                >
                  DESCONECTAR
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 rounded-xl px-6 h-11 transition-all"
                  >
                    LOG IN
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button 
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-500 text-zinc-50 text-[10px] font-black uppercase tracking-[0.2em] px-8 h-11 rounded-xl shadow-2xl shadow-blue-600/20 border-b-2 border-blue-800 active:border-b-0 active:translate-y-0.5 transition-all"
                  >
                    HACERSE SOCIO
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden flex items-center gap-4">
            {user && (
               <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100 font-black text-sm">
                 {user.username[0].toUpperCase()}
               </div>
            )}
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="text-zinc-400 hover:text-zinc-100 transition-colors p-2"
            >
              {isOpen ? <XMarkIcon className="w-8 h-8" /> : <Bars3Icon className="w-8 h-8" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-zinc-950 border-b border-zinc-800 animate-in slide-in-from-top duration-300">
          <div className="px-6 py-8 space-y-6">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`text-sm font-black tracking-[0.2em] uppercase p-4 rounded-xl border ${
                    pathname.startsWith(link.href)
                      ? 'bg-blue-600/10 border-blue-500/30 text-blue-400'
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="pt-6 border-t border-zinc-800 flex flex-col gap-4">
              {user ? (
                <Button 
                  onClick={() => { logout(); setIsOpen(false); }}
                  className="w-full bg-red-600/10 text-red-500 border border-red-500/20 py-6 font-black uppercase tracking-widest text-[10px]"
                >
                  CERRAR SESIÓN
                </Button>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full py-6 font-black uppercase tracking-widest text-[10px] border-zinc-800 text-zinc-400">
                      LOG IN
                    </Button>
                  </Link>
                  <Link href="/auth/register" onClick={() => setIsOpen(false)}>
                    <Button className="w-full py-6 font-black uppercase tracking-widest text-[10px] bg-blue-600">
                      HACERSE SOCIO
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
