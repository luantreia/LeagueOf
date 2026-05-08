'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { forgotPassword } from '@/lib/api/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await forgotPassword(email);
      setSent(true);
      toast.success('Revisa tu email para continuar');
    } catch (error: any) {
      const message = error.response?.data?.message || 'No pudimos iniciar la recuperacion';
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
            <CardTitle>Recuperar contrasena</CardTitle>
            <CardDescription>
              Te enviaremos un enlace temporal para crear una contrasena nueva.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-100">
                Si existe una cuenta con ese email, el enlace ya fue enviado. Expira en 1 hora.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Correo electronico"
                  type="email"
                  name="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full" isLoading={isLoading}>
                  Enviar enlace
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter>
            <p className="text-sm text-gray-400 w-full text-center">
              <Link href="/auth/login" className="text-blue-500 font-semibold hover:underline">
                Volver al login
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
