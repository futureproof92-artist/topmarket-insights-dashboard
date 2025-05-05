
import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface AppShellProps {
  children: React.ReactNode;
  user?: {
    role: string;
    email: string;
  };
}

export const AppShell = ({ children, user: propUser }: AppShellProps) => {
  const { user: authUser, userRole, session, signOut } = useAuth();
  const [user, setUser] = useState<{ role: string; email: string } | null>(null);
  const [impersonatedRole, setImpersonatedRole] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Validar sesión JWT cada vez que AppShell se renderiza
  useEffect(() => {
    const validateJwtSession = async () => {
      // Verificación estricta de sesión JWT
      if (session) {
        const tokenExpiration = session.expires_at * 1000;
        const timeRemaining = Math.round((tokenExpiration - Date.now())/60000);
        
        console.log("[AUTH_DEBUG] AppShell: Sesión JWT disponible", {
          userId: session.user.id,
          tokenActivo: !!session.access_token,
          expira: new Date(tokenExpiration).toLocaleString(),
          tiempoRestante: timeRemaining + " minutos",
          fuente: session.access_token.startsWith("ey") ? "Supabase JWT" : "Token inválido"
        });
        
        // Validar token JWT
        if (!session.access_token || !session.access_token.startsWith("ey")) {
          console.log("[AUTH_DEBUG] AppShell: ⚠️ Token JWT inválido detectado - Cerrando sesión");
          await signOut();
          toast({
            title: "Error de autenticación",
            description: "Tu token de sesión es inválido. Por favor inicia sesión de nuevo.",
            variant: "destructive"
          });
          navigate('/');
          return;
        }
        
        // Advertir si el token está por expirar (menos de 10 minutos)
        if (timeRemaining < 10) {
          console.log("[AUTH_DEBUG] AppShell: ⚠️ Token JWT a punto de expirar");
          toast({
            title: "Sesión por expirar",
            description: `Tu sesión expirará en ${timeRemaining} minutos. Considera cerrar sesión y volver a iniciar para renovar tu token.`,
            variant: "warning"
          });
        }
      } else {
        console.log("[AUTH_DEBUG] AppShell: ⚠️ No hay sesión JWT activa");
        // Redirigir solo si no estamos ya en la página principal
        if (window.location.pathname !== '/' && !window.location.pathname.startsWith('/login')) {
          toast({
            title: "Sesión no disponible",
            description: "No se encontró una sesión activa. Por favor inicia sesión.",
            variant: "destructive"
          });
          navigate('/');
          return;
        }
      }
      
      // Log del estado de usuario
      if (authUser) {
        console.log("[AUTH_DEBUG] AppShell: Usuario autenticado:", {
          id: authUser.id,
          email: authUser.email,
          role: userRole || 'sin_rol'
        });
      } else {
        console.log("[AUTH_DEBUG] AppShell: ⚠️ No hay usuario autenticado");
      }
    };
    
    validateJwtSession();
  }, [session, authUser, userRole, navigate, toast, signOut]);
  
  // Cargar usuario desde context 
  useEffect(() => {
    // Usar el usuario autenticado desde el contexto
    if (authUser && session) {
      const email = authUser.email || '';
      const role = userRole || 'user';
      
      const userData = { email, role };
      setUser(userData);
      console.log("[AUTH_DEBUG] AppShell: Usuario establecido desde authUser:", userData);
    } 
    // Si no hay usuario en el contexto pero hay props, usarlos temporalmente
    else if (propUser) {
      setUser(propUser);
      console.log("[AUTH_DEBUG] AppShell: Usuario establecido desde props (temporal):", propUser);
    }
    
    // Restaurar el rol suplantado si existía
    const savedRole = localStorage.getItem('impersonatedRole');
    if (savedRole) {
      setImpersonatedRole(savedRole);
      console.log("[AUTH_DEBUG] AppShell: Modo de impersonación restaurado:", savedRole);
    }
  }, [authUser, propUser, userRole, session]);

  // Handle impersonation changes
  const handleImpersonate = (role: string | null) => {
    setImpersonatedRole(role);
    
    if (role) {
      localStorage.setItem('impersonatedRole', role);
      console.log("[AUTH_DEBUG] AppShell: Iniciando impersonación de rol:", role);
      toast({
        title: "Modo de edición",
        description: `Ahora estás viendo como ${role}`,
      });
    } else {
      localStorage.removeItem('impersonatedRole');
      console.log("[AUTH_DEBUG] AppShell: Finalizando impersonación, volviendo a rol normal");
      toast({
        title: "Modo normal",
        description: "Has vuelto a tu vista normal",
      });
    }
  };

  // Verificar si el usuario está disponible o tiene una sesión JWT válida
  if ((!user && !authUser) || !session?.access_token) {
    console.log("[AUTH_DEBUG] AppShell: ⚠️ No hay usuario disponible o sesión JWT válida, mostrando pantalla de carga");
    return <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <div className="mb-4 text-lg font-medium">Verificando sesión...</div>
        <div className="text-sm text-muted-foreground">
          Si no eres redirigido automáticamente, haz clic <a href="/" className="text-blue-500 hover:underline">aquí</a> para volver al inicio.
        </div>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <Sidebar 
        user={user} 
        impersonatedRole={impersonatedRole} 
        onImpersonate={handleImpersonate}
      />
      <div className="flex-1 flex flex-col">
        <TopBar 
          user={user} 
          impersonatedRole={impersonatedRole} 
        />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
