
import React, { useEffect, useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '@/components/auth/LoginForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle, HelpCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [jwtVerified, setJwtVerified] = useState(false);
  const userInfo = role ? getUserInfo(role) : null;

  useEffect(() => {
    // Resetear errores al cargar la página
    setLoginError(null);
    setLoginAttempts(0);
    setJwtVerified(false);
    
    // Si ya hay un usuario autenticado con JWT válido, redireccionar según su rol
    if (user && session && session.access_token && session.access_token.startsWith('ey')) {
      console.log("[AUTH_DEBUG] Usuario con JWT válido detectado:", user.email);
      setJwtVerified(true);
      
      const userRole = user.user_metadata?.role || 
                     (user.email?.includes('sergio.t@topmarket.com.mx') ? 'admin' : null);
      
      if (userRole === 'admin' || user.email?.toLowerCase().includes('sergio.t@topmarket.com.mx')) {
        console.log("[AUTH_DEBUG] Redirigiendo a administrador a /admin (JWT verificado)");
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
    } else if (user && !session?.access_token) {
      console.log("[AUTH_DEBUG] ⚠️ Usuario detectado pero sin JWT válido");
      setLoginError("Se detectó un usuario pero sin token JWT válido. Por favor inicia sesión de nuevo.");
    }
  }, [user, session, navigate]);

  if (!userInfo) {
    console.log("[AUTH_DEBUG] Rol no válido, redirigiendo a la página principal");
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (email: string, password: string) => {
    try {
      setLoginError(null);
      const { error, data } = await signIn(email, password);
      
      if (error || !data) {
        console.error("[AUTH_DEBUG] Error durante el login JWT:", error);
        setLoginAttempts(prev => prev + 1);
        
        // Mensaje personalizado según el número de intentos
        if (loginAttempts >= 2) {
          setLoginError("Múltiples intentos fallidos. Verifica que tu cuenta existe en Supabase o contacta al administrador.");
        } else {
          setLoginError(error?.message || "Error al iniciar sesión con JWT. Inténtalo de nuevo.");
        }
        return;
      }
      
      // Verificación adicional del token JWT
      if (!data.access_token || !data.access_token.startsWith('ey')) {
        console.error("[AUTH_DEBUG] Token JWT inválido generado");
        setLoginError("Error de autenticación: Token JWT inválido. Contacta al administrador.");
        return;
      }
      
      console.log("[AUTH_DEBUG] Login JWT exitoso en UserLoginPage:", email, role);
      setJwtVerified(true);
      
      // La redirección se manejará automáticamente en el useEffect
    } catch (error) {
      console.error("[AUTH_DEBUG] Error inesperado durante el login JWT:", error);
      setLoginError("Error de conexión al verificar JWT. Por favor intenta más tarde.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800">TopMarket</h2>
          <p className="text-muted-foreground mt-2">Acceso seguro para {userInfo.name}</p>
          {jwtVerified && (
            <div className="flex items-center justify-center mt-2 text-green-600">
              <ShieldCheck className="h-5 w-5 mr-1" />
              <span className="text-sm">Autenticación JWT verificada</span>
            </div>
          )}
        </div>

        <Button 
          variant="outline" 
          onClick={() => navigate('/')}
          className="mb-4 flex items-center"
        >
          <ArrowLeft className="mr-2" size={16} />
          Menú Principal
        </Button>

        {loginError && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error de autenticación JWT</AlertTitle>
            <AlertDescription>
              {loginError}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Iniciar sesión - {userInfo.description}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle size={16} className="text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Este sistema usa autenticación segura con Supabase JWT. Si no puedes acceder, 
                      contacta al administrador para verificar tu cuenta.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder de forma segura
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
