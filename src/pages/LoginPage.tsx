
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '@/components/auth/LoginForm';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();

  const handleLogin = (email: string) => {
    // Simulación de roles basados en email
    let role;
    if (email.includes('dcomercial')) {
      role = 'evelyn';
    } else if (email.includes('rys_cdmx')) {
      role = 'davila';
    } else if (email.includes('rlaboral')) {
      role = 'lilia';
    } else if (email.includes('administracion')) {
      role = 'cobranza';
    } else if (email.includes('sergio.t')) {
      role = 'admin';
    } else if (email.includes('reclutamiento')) {
      role = 'nataly';
    } else {
      role = 'evelyn'; // Default para pruebas
    }

    // En una aplicación real, esto vendría del JWT
    localStorage.setItem('user', JSON.stringify({ email, role }));
    
    // Redirección basada en email
    if (email.includes('dcomercial')) {
      navigate('/ventas');
    } else if (email.includes('rys_cdmx')) {
      navigate('/pxr-cerrados');
    } else if (email.includes('rlaboral')) {
      navigate('/hh-cerrados');
    } else if (email.includes('administracion')) {
      navigate('/cobranza');
    } else if (email.includes('sergio.t')) {
      navigate('/admin');
    } else if (email.includes('reclutamiento')) {
      navigate('/cobranza');
    } else {
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
        case 'cobranza':
          navigate('/cobranza');
          break;
        case 'admin':
          navigate('/admin');
          break;
        default:
          navigate('/');
      }
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
              Ingresa tus credenciales para acceder
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm onLogin={handleLogin} />
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-xs text-muted-foreground mt-4 text-center">
              Para demostración, usa los correos asignados:<br />
              dcomercial@topmarket.com.mx, rys_cdmx@topmarket.com.mx,<br />
              rlaboral@topmarket.com.com.mx, administracion@topmarket.com.mx,<br />
              sergio.t@topmarket.com.mx, reclutamiento@topmarket.com.mx
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
