
import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';

interface AppShellProps {
  children: React.ReactNode;
  user?: {
    role: string;
    email: string;
  };
}

export const AppShell = ({ children, user: propUser }: AppShellProps) => {
  const { user: authUser, userRole, session, signOut, isSessionValid, validateSession } = useAuth();
  const [user, setUser] = useState<{ role: string; email: string } | null>(null);
  const [impersonatedRole, setImpersonatedRole] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthPage = location.pathname === '/' || location.pathname.startsWith('/login');
  
  // Usar el hook centralizado para validar sesión
  useEffect(() => {
    const checkSession = async () => {
      // Solo validar si no estamos en una página de autenticación
      if (isAuthPage) {
        console.log("[AUTH_DEBUG] Estamos en página de autenticación, omitiendo validación");
        return;
      }
      
      // Utilizamos la función centralizada de validación
      const isValid = await validateSession();
      
      if (!isValid) {
        console.log("[AUTH_DEBUG] AppShell: Sesión inválida, redirigiendo al inicio");
        
        // Redirigir solo si no estamos ya en la página principal o login
        if (!isAuthPage) {
          toast({
            title: "Sesión no disponible",
            description: "No se encontró una sesión activa. Por favor inicia sesión.",
            variant: "destructive"
          });
          
          await signOut();
          
          // Usar setTimeout para evitar problemas con actualización de estado durante render
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 0);
        }
      }
    };
    
    checkSession();
  }, [isAuthPage, validateSession, navigate, toast, signOut]);
  
  // Cargar usuario desde context 
  useEffect(() => {
    // Usar el usuario autenticado desde el contexto
    if (authUser && session) {
      const email = authUser.email || '';
      const role = userRole || 'user';
      
      const userData = { email, role };
      setUser(userData);
      console.log("[AUTH_DEBUG] AppShell: Usuario establecido desde authUser (RLS compatible):", userData);
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

  // Solo mostramos pantalla de carga en el caso extremo de no tener usuario y no estar en auth
  if (!isAuthPage && !user && !authUser) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">TopMarket</h1>
        <p className="text-lg mb-4">Redirigiendo...</p>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background w-full">
      <Sidebar 
        user={user} 
        impersonatedRole={impersonatedRole} 
        onImpersonate={handleImpersonate}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
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
