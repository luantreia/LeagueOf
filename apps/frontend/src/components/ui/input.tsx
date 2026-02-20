import React, { InputHTMLAttributes } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  className?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-[11px] font-black uppercase tracking-[0.15em] text-zinc-500 mb-2 ml-1" htmlFor={props.id}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full px-4 py-3 bg-zinc-950/60 border border-zinc-800 rounded-xl",
            "text-zinc-50 font-medium placeholder-zinc-600 focus:outline-none focus:ring-1",
            "focus:ring-blue-500/30 focus:border-blue-500/50 transition-all duration-300",
            "hover:bg-zinc-900/40",
            error ? "border-red-500/50 focus:ring-red-500/50 focus:border-red-500" : "",
            className
          )}
          {...props}
        />
        {error && <p className="mt-2 text-xs text-red-400 ml-1 font-bold animate-pulse uppercase tracking-tight">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
