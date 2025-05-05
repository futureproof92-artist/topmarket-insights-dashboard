
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
  const { user, session, signIn } = useAuth();
  const userInfo = role ? getUserInfo(role) : null;

  useEffect(() => {
    // Si ya hay un usuario autenticado, redireccionar según su rol
    if (user && session) {
      console.log("Usuario autenticado detectado:", user.email);
      
      const userRole = user.user_metadata?.role || 
                     (user.email?.includes('sergio.t@topmarket.com.mx') ? 'admin' : null);
      
      if (userRole === 'admin' || user.email?.toLowerCase().includes('sergio.t@topmarket.com.mx')) {
        console.log("Redirigiendo a administrador a /admin");
        navigate('/admin');
        return;
      }
      
      // Para otros usuarios, redirección basada en rol
      switch(userRole) {
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
        case 'cobranza':
          navigate('/cobranza');
          break;
        default:
          // Fallback basado en email
          const email = user.email?.toLowerCase() || '';
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
          }
      }
    }
  }, [user, session, navigate]);

  if (!userInfo) {
    console.log("Rol no válido, redirigiendo a la página principal");
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (email: string, password: string) => {
    try {
      const { error, data } = await signIn(email, password);
      
      if (error || !data) {
        console.error("Error durante el login:", error);
        return;
      }
      
      console.log("Login exitoso en UserLoginPage:", email, role);
      
      // La redirección se manejará automáticamente en el useEffect
    } catch (error) {
      console.error("Error inesperado durante el login:", error);
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
