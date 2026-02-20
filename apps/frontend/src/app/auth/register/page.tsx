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

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
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
      
      // Save full user
      localStorage.setItem('user', JSON.stringify(response.user));
      
      toast.success('¡Registro exitoso! Iniciando sesión...');
      
      // Redirect to home or onboarding
      router.push('/');
      router.refresh();
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
      </div>
    </div>
  );
}
