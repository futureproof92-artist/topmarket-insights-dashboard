
import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AppShellProps {
  children: React.ReactNode;
  user?: {
    role: string;
    email: string;
  };
}

export const AppShell = ({ children, user: propUser }: AppShellProps) => {
  const { user: authUser, userRole, session } = useAuth();
  const [user, setUser] = useState<{ role: string; email: string } | null>(null);
  const [impersonatedRole, setImpersonatedRole] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Log de estado de sesión cada vez que AppShell se renderiza
  useEffect(() => {
    if (session) {
      console.log("[AUTH_DEBUG] AppShell: Sesión disponible", {
        userId: session.user.id,
        tokenActivo: !!session.access_token,
        expira: new Date(session.expires_at * 1000).toLocaleString(),
        tiempoRestante: Math.round((session.expires_at - Date.now()/1000)/60) + " minutos",
        fuente: session.access_token.startsWith("ey") ? "Supabase" : "Fallback"
      });
    } else {
      console.log("[AUTH_DEBUG] AppShell: ⚠️ No hay sesión activa de Supabase");
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
  }, [session, authUser, userRole]);
  
  // Cargar usuario desde context o localStorage
  useEffect(() => {
    // Primero intentamos usar el usuario autenticado desde el contexto
    if (authUser) {
      const email = authUser.email || '';
      const role = userRole || 'user';
      
      const userData = { email, role };
      setUser(userData);
      console.log("[AUTH_DEBUG] AppShell: Usuario establecido desde authUser:", userData);
    } 
    // Si no hay usuario en el contexto, intentamos cargar desde localStorage
    else {
      const savedUser = localStorage.getItem('user');
      
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        console.log("[AUTH_DEBUG] AppShell: Usuario cargado desde localStorage:", parsedUser);
      } else if (propUser) {
        // Si se pasa un usuario como prop, usarlo como respaldo
        setUser(propUser);
        console.log("[AUTH_DEBUG] AppShell: Usuario establecido desde props:", propUser);
      }
    }
    
    // Restaurar el rol suplantado si existía
    const savedRole = localStorage.getItem('impersonatedRole');
    if (savedRole) {
      setImpersonatedRole(savedRole);
      console.log("[AUTH_DEBUG] AppShell: Modo de impersonación restaurado:", savedRole);
    }
  }, [authUser, propUser, userRole]);

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

  // Verificar si el usuario está disponible
  if (!user && !authUser) {
    console.log("[AUTH_DEBUG] AppShell: ⚠️ No hay usuario disponible, mostrando pantalla de carga");
    return <div className="flex justify-center items-center min-h-screen">Cargando...</div>;
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
