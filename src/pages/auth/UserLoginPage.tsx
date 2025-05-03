
import React, { useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '@/components/auth/LoginForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const getUserInfo = (role: string) => {
  const userInfo = {
    evelyn: {
      name: "Evelyn Matheus",
      description: "Ventas y Prospecciones"
    },
    karla: {
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
  const { user } = useAuth();
  const userInfo = role ? getUserInfo(role) : null;

  useEffect(() => {
    // Si ya hay un usuario autenticado, redireccionar según su rol
    if (user) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        
        // Redirección específica para el administrador
        if (userData.email.toLowerCase().includes('sergio.t@topmarket.com.mx') || userData.role === 'admin') {
          navigate('/admin');
          return;
        }
        
        // Para otros usuarios, redirección basada en email/role
        if (userData.email.includes('dcomercial')) {
          navigate('/ventas');
        } else if (userData.email.includes('rys_cdmx')) {
          navigate('/pxr-cerrados');
        } else if (userData.email.includes('rlaboral')) {
          navigate('/hh-cerrados');
        } else if (userData.email.includes('administracion')) {
          navigate('/cobranza');
        } else if (userData.email.includes('reclutamiento')) {
          navigate('/reclutamiento');
        }
      }
    }
  }, [user, navigate]);

  if (!userInfo) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = (email: string, password: string) => {
    console.log("Login exitoso en UserLoginPage:", email, role);
    
    // Mantener compatibilidad con el sistema anterior
    const userData = { email, role };
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.removeItem('impersonatedRole');
    
    // Redirección específica para el administrador
    if (email.toLowerCase().includes('sergio.t@topmarket.com.mx') || role === 'admin') {
      navigate('/admin');
      return;
    }
    
    // Para otros usuarios, redirección basada en email/role
    if (email.includes('dcomercial')) {
      navigate('/ventas');
    } else if (email.includes('rys_cdmx')) {
      navigate('/pxr-cerrados');
    } else if (email.includes('rlaboral')) {
      navigate('/hh-cerrados');
    } else if (email.includes('administracion')) {
      navigate('/cobranza');
    } else if (email.includes('reclutamiento')) {
      navigate('/reclutamiento');
    } else {
      // Fallback basado en el rol actual
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
        case 'karla':
          navigate('/reclutamiento');
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800">TopMarket</h2>
          <p className="text-muted-foreground mt-2">Acceso para {userInfo.name}</p>
        </div>

        <Button 
          variant="outline" 
          onClick={() => navigate('/')}
          className="mb-4 flex items-center"
        >
          <ArrowLeft className="mr-2" size={16} />
          Menú Principal
        </Button>

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
