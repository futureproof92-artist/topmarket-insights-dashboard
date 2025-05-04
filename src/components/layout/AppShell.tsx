
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

export const AppShell = ({ children }: AppShellProps) => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<{ role: string; email: string } | null>(null);
  const [impersonatedRole, setImpersonatedRole] = useState<string | null>(null);
  
  // Cargar usuario desde localStorage para mantener compatibilidad
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      console.log("Usuario cargado desde localStorage:", JSON.parse(savedUser));
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
    }
    
    const savedRole = localStorage.getItem('impersonatedRole');
    if (savedRole) {
      setImpersonatedRole(savedRole);
    }
  }, [authUser]);

  // Handle impersonation changes
  const handleImpersonate = (role: string | null) => {
    setImpersonatedRole(role);
    
    if (role) {
      localStorage.setItem('impersonatedRole', role);
    } else {
      localStorage.removeItem('impersonatedRole');
    }
  };

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
