'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { register } from '@/lib/api/auth';
import { setAuthToken } from '@/lib/api/auth-storage';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api/api-client';

export default function RegisterPage() {
  const router = useRouter();
  const { authenticate } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [guestCount, setGuestCount] = useState(0);
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const checkForGuests = async (email: string) => {
    try {
      const response = await apiClient.checkForGuests(email);
      if (response.data.hasGuests) {
        setGuestCount(response.data.guestCount);
        setShowGuestModal(true);
      }
    } catch (error) {
      // Silently fail, not critical
    }
  };

  const handleEmailBlur = () => {
    if (formData.email && formData.email.includes('@')) {
      checkForGuests(formData.email);
    }
  };

  const sendVerificationCode = async () => {
    try {
      await apiClient.sendGuestVerificationCode(formData.email);
      toast.success('Código enviado a tu email');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al enviar código');
    }
  };

  const claimGuests = async () => {
    try {
      const response = await apiClient.verifyAndClaimGuests(verificationCode, formData.email);
      if (response.data.claimed) {
        toast.success(`¡Reclamaste ${response.data.guestCount} invitados!`);
        setShowGuestModal(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Código inválido');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);

    try {
      const response = await register({
        displayName: formData.displayName,
        username: formData.username.toLowerCase(),
        email: formData.email,
        password: formData.password,
      });

      // Store token
      setAuthToken(response.accessToken);
      authenticate(response.user);

      toast.success('¡Registro exitoso! Iniciando sesión...');

      // Check for guests after registration
      const guestCheck = await apiClient.checkForGuests(formData.email);
      if (guestCheck.data.hasGuests) {
        setGuestCount(guestCheck.data.guestCount);
        setShowGuestModal(true);
      } else {
        router.push('/');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al registrarse';
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
            <CardTitle>Crea tu cuenta</CardTitle>
            <CardDescription>
              Únete a la plataforma competitiva más grande de la región.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nombre para mostrar"
                type="text"
                name="displayName"
                placeholder="Tu nombre real o nick"
                value={formData.displayName}
                onChange={handleChange}
                required
              />
              <Input
                label="Nombre de usuario"
                type="text"
                name="username"
                placeholder="leaguemaster99"
                value={formData.username}
                onChange={handleChange}
                required
              />
              <Input
                label="Correo electrónico"
                type="email"
                name="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleEmailBlur}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Contraseña"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Repetir contraseña"
                  type="password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
              <Button type="submit" className="w-full" isLoading={isLoading}>
                Crear Avatar
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-gray-400 w-full text-center">
              ¿Ya tienes cuenta?{' '}
              <Link href="/auth/login" className="text-blue-500 font-semibold hover:underline">
                Inicia sesión
              </Link>
            </p>
          </CardFooter>
        </Card>

        {/* Modal para reclamar guests */}
        {showGuestModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-xl">¡Encontramos invitados!</CardTitle>
                <CardDescription>
                  Tienes {guestCount} invitado{guestCount !== 1 ? 's' : ''} esperando ser reclamado{guestCount !== 1 ? 's' : ''}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <p className="text-sm text-blue-200">
                    Si jugaste como invitado anteriormente, puedes reclamar esas partidas para tu perfil actual.
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Código de verificación</label>
                  <Input
                    placeholder="Ingresa el código de 6 dígitos"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    maxLength={6}
                    className="text-center text-2xl tracking-widest"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={sendVerificationCode}
                    className="flex-1"
                  >
                    Enviar código
                  </Button>
                  <Button
                    onClick={claimGuests}
                    disabled={verificationCode.length !== 6}
                    className="flex-1 bg-blue-600 hover:bg-blue-500"
                  >
                    Reclamar
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowGuestModal(false);
                    router.push('/');
                  }}
                  className="w-full text-zinc-400 hover:text-zinc-200"
                >
                  Omitir y continuar
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
