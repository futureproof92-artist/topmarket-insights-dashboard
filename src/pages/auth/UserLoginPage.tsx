
import React from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '@/components/auth/LoginForm';

const getUserInfo = (role: string) => {
  const userInfo = {
    evelyn: {
      name: "Evelyn Matheus",
      description: "Ventas y Prospecciones"
    },
    nataly: {
      name: "Karla Casillas",
      description: "Nuevo Personal Reclutamiento"
    },
    davila: {
      name: "Gaby Davila",
      description: "PXR Cerrados"
    },
    lilia: {
      name: "Lilia Morales",
      description: "HH Cerrados"
    },
    cobranza: {
      name: "Nataly Zarate",
      description: "Cobranza"
    },
    admin: {
      name: "Sergio Tellez",
      description: "Administrador"
    }
  };
  return userInfo[role as keyof typeof userInfo];
};

const UserLoginPage = () => {
  const { role } = useParams();
  const navigate = useNavigate();
  const userInfo = role ? getUserInfo(role) : null;

  if (!userInfo) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = (email: string, password: string) => {
    console.log("Login exitoso en UserLoginPage:", email, role);
    
    // Store user information in localStorage
    localStorage.setItem('user', JSON.stringify({ email, role }));
    
    // Clear any impersonation that might exist
    localStorage.removeItem('impersonatedRole');
    
    // Specific redirection for administrator
    if (email.toLowerCase().includes('sergio.t@topmarket.com.mx') || role === 'admin') {
      navigate('/admin');
      return;
    }
    
    // For other users, redirection based on email/role
    if (email.includes('dcomercial')) {
      navigate('/ventas');
    } else if (email.includes('rys_cdmx')) {
      navigate('/pxr-cerrados');
    } else if (email.includes('rlaboral')) {
      navigate('/hh-cerrados');
    } else if (email.includes('administracion')) {
      navigate('/cobranza');
    } else if (email.includes('reclutamiento')) {
      navigate('/cobranza');
    } else {
      // Fallback based on current role
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
          <p className="text-muted-foreground mt-2">Acceso para {userInfo.name}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Iniciar sesión - {userInfo.description}</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm onLogin={handleLogin} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserLoginPage;
