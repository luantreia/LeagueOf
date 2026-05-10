'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface PlayerOption {
  key: string;
  name: string;
}

interface PlayerSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: PlayerOption[];
  placeholder?: string;
  className?: string;
}

export function PlayerSelect({ value, onChange, options, placeholder = 'Buscar jugador...', className = '' }: PlayerSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.key === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: PlayerOption) => {
    onChange(option.key);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    onChange('');
    setSearchTerm('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Input
          value={selectedOption?.name || searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={selectedOption?.name || placeholder}
          className="h-12 bg-zinc-950 border-zinc-800 pr-10"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl max-h-60 overflow-y-auto">
          {filteredOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => handleSelect(option)}
              className={`w-full text-left px-4 py-3 hover:bg-zinc-800 transition-colors ${
                value === option.key ? 'bg-blue-600/20 text-blue-400' : 'text-zinc-100'
              }`}
            >
              {option.name}
            </button>
          ))}
        </div>
      )}

      {isOpen && filteredOptions.length === 0 && searchTerm && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl px-4 py-3 text-zinc-500">
          No hay resultados
        </div>
      )}
    </div>
  );
}
