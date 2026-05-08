'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { resetPassword } from '@/lib/api/auth';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('El enlace de recuperacion no es valido');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Las contrasenas no coinciden');
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(token, password);
      toast.success('Contrasena actualizada. Ya puedes iniciar sesion.');
      router.push('/auth/login');
    } catch (error: any) {
      const message = error.response?.data?.message || 'No pudimos actualizar la contrasena';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-black italic tracking-tighter text-blue-500 hover:text-blue-400 transition-colors">
              LEAGUE OF
            </h1>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nueva contrasena</CardTitle>
            <CardDescription>
              Define una contrasena nueva para recuperar el acceso a tu cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!token ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
                Este enlace no contiene un token valido. Solicita uno nuevo.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Nueva contrasena"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
                <Input
                  label="Repetir contrasena"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  required
                />
                <Button type="submit" className="w-full" isLoading={isLoading}>
                  Actualizar contrasena
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter>
            <p className="text-sm text-gray-400 w-full text-center">
              <Link href="/auth/forgot-password" className="text-blue-500 font-semibold hover:underline">
                Solicitar otro enlace
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
