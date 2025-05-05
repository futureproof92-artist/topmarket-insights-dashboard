
import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAuth } from '@/context/AuthContext';

interface AppShellProps {
  children: React.ReactNode;
  user?: {
    role: string;
    email: string;
  };
}

export const AppShell = ({ children, user: propUser }: AppShellProps) => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<{ role: string; email: string } | null>(null);
  const [impersonatedRole, setImpersonatedRole] = useState<string | null>(null);
  
  // Cargar usuario desde localStorage o desde auth context
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      console.log("Usuario cargado desde localStorage:", parsedUser);
    } else if (authUser) {
      // Si no hay usuario en localStorage pero sí en la sesión de Supabase
      const email = authUser.email || '';
      let role = 'user';
      
      // Determinar role basado en el email
      if (email.includes('sergio.t@topmarket.com.mx')) {
        role = 'admin';
      } else if (email.includes('dcomercial')) {
        role = 'evelyn';
      } else if (email.includes('rys_cdmx')) {
        role = 'davila';
      } else if (email.includes('rlaboral')) {
        role = 'lilia';
      } else if (email.includes('administracion')) {
        role = 'cobranza';
      } else if (email.includes('reclutamiento')) {
        role = 'karla';
      }
      
      const userData = { email, role };
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      console.log("Usuario generado desde authUser:", userData);
    } else if (propUser) {
      // Si se pasa un usuario como prop, usarlo como respaldo
      setUser(propUser);
      console.log("Usuario establecido desde props:", propUser);
    }
    
    const savedRole = localStorage.getItem('impersonatedRole');
    if (savedRole) {
      setImpersonatedRole(savedRole);
    }
  }, [authUser, propUser]);

  // Handle impersonation changes
  const handleImpersonate = (role: string | null) => {
    setImpersonatedRole(role);
    
    if (role) {
      localStorage.setItem('impersonatedRole', role);
    } else {
      localStorage.removeItem('impersonatedRole');
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
