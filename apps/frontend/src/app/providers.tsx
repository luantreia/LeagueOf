'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { SocketProvider } from '@/lib/socket/socket-provider';
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from 'react-hot-toast';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          {children}
          <Toaster 
            position="top-right" 
            toastOptions={{
              className: 'bg-gray-900 text-white border border-gray-800',
              duration: 4000,
            }} 
          />
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
