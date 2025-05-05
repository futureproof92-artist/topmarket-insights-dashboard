
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
  const { user: authUser, userRole } = useAuth();
  const [user, setUser] = useState<{ role: string; email: string } | null>(null);
  const [impersonatedRole, setImpersonatedRole] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Cargar usuario desde context o localStorage
  useEffect(() => {
    // Primero intentamos usar el usuario autenticado desde el contexto
    if (authUser) {
      const email = authUser.email || '';
      const role = userRole || 'user';
      
      const userData = { email, role };
      setUser(userData);
      console.log("Usuario establecido desde authUser:", userData);
    } 
    // Si no hay usuario en el contexto, intentamos cargar desde localStorage
    else {
      const savedUser = localStorage.getItem('user');
      
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        console.log("Usuario cargado desde localStorage:", parsedUser);
      } else if (propUser) {
        // Si se pasa un usuario como prop, usarlo como respaldo
        setUser(propUser);
        console.log("Usuario establecido desde props:", propUser);
      }
    }
    
    // Restaurar el rol suplantado si existía
    const savedRole = localStorage.getItem('impersonatedRole');
    if (savedRole) {
      setImpersonatedRole(savedRole);
    }
  }, [authUser, propUser, userRole]);

  // Handle impersonation changes
  const handleImpersonate = (role: string | null) => {
    setImpersonatedRole(role);
    
    if (role) {
      localStorage.setItem('impersonatedRole', role);
      toast({
        title: "Modo de edición",
        description: `Ahora estás viendo como ${role}`,
      });
    } else {
      localStorage.removeItem('impersonatedRole');
      toast({
        title: "Modo normal",
        description: "Has vuelto a tu vista normal",
      });
    }
  };

  // Verificar si el usuario está disponible
  if (!user && !authUser) {
    console.log("No hay usuario disponible, mostrando pantalla de carga");
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
