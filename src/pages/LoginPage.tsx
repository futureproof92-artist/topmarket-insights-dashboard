
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '@/components/auth/LoginForm';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();

  const handleLogin = (email: string) => {
    // Simulación de roles basados en email
    let role;
    if (email.includes('evelyn')) {
      role = 'evelyn';
    } else if (email.includes('davila')) {
      role = 'davila';
    } else if (email.includes('lilia')) {
      role = 'lilia';
    } else if (email.includes('nataly')) {
      role = 'nataly';
    } else if (email.includes('admin')) {
      role = 'admin';
    } else {
      role = 'evelyn'; // Default para pruebas
    }

    // En una aplicación real, esto vendría del JWT
    localStorage.setItem('user', JSON.stringify({ email, role }));
    
    // Redirección basada en rol
    switch(role) {
      case 'evelyn':
        navigate('/ventas');
        break;
      case 'davila':
        navigate('/pxr-cerrados');
        break;
      case 'lilia':
        navigate('/hh-cerrados');
        break;
      case 'nataly':
        navigate('/cobranza');
        break;
      case 'admin':
        navigate('/admin');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">TopMarket</h2>
          <p className="text-muted-foreground mt-2">Dashboard de Reportes y Gastos</p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Iniciar sesión</CardTitle>
            <CardDescription>
              Ingresa tu correo electrónico para recibir un Magic Link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm onLogin={handleLogin} />
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-xs text-muted-foreground mt-4 text-center">
              Para demostración, usa estos correos:<br />
              evelyn@topmarket.com, davila@topmarket.com,<br />
              lilia@topmarket.com, nataly@topmarket.com,<br />
              admin@topmarket.com
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
