import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={cn("bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/60 rounded-2xl overflow-hidden shadow-xl shadow-black/40", className)}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("p-6 border-b border-zinc-800/50 hover:bg-zinc-800/10 transition-colors", className)}>{children}</div>
);

export const CardTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <h3 className={cn("text-2xl font-black text-zinc-50 tracking-tight", className)}>{children}</h3>
);

export const CardDescription = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <p className={cn("text-sm text-zinc-400 font-medium leading-relaxed mt-1.5", className)}>{children}</p>
);

export const CardContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("p-6", className)}>{children}</div>
);

export const CardFooter = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("p-6 border-t border-zinc-800/50 flex items-center justify-between", className)}>{children}</div>
);
