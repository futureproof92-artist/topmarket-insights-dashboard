
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  userRole: string | null;
  signIn: (email: string, password: string) => Promise<{
    error: any | null;
    data: Session | null;
  }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const { toast } = useToast();

  // Determinar role basado en el email
  const determineRoleFromEmail = (email: string): string => {
    if (!email) return 'user';
    
    email = email.toLowerCase();
    if (email.includes('sergio.t@topmarket.com.mx')) {
      return 'admin';
    } else if (email.includes('dcomercial')) {
      return 'evelyn';
    } else if (email.includes('rys_cdmx')) {
      return 'davila';
    } else if (email.includes('rlaboral')) {
      return 'lilia';
    } else if (email.includes('administracion')) {
      return 'cobranza';
    } else if (email.includes('reclutamiento')) {
      return 'karla';
    }
    return 'user';
  };

  // Sincronizar el estado del usuario con localStorage para mantener compatibilidad
  const syncUserToLocalStorage = (currentUser: User | null, currentSession: Session | null) => {
    if (!currentUser) {
      localStorage.removeItem('user');
      return;
    }

    const role = currentUser.user_metadata?.role || determineRoleFromEmail(currentUser.email || '');
    
    const userData = {
      id: currentUser.id,
      email: currentUser.email,
      role: role
    };
    
    localStorage.setItem('user', JSON.stringify(userData));
    setUserRole(role);

    // Log JWT token para diagnóstico
    if (currentSession) {
      const createdAt = new Date().toLocaleString(); // Fallback para created_at
      console.log("[AUTH_DEBUG] Token JWT disponible:", !!currentSession.access_token);
      console.log("[AUTH_DEBUG] Estado del token:", {
        emitido: createdAt,
        expira: new Date(currentSession.expires_at * 1000).toLocaleString(),
        tiempoRestante: Math.round((currentSession.expires_at - Date.now()/1000)/60) + " minutos"
      });
    } else {
      console.log("[AUTH_DEBUG] ⚠️ No hay token JWT disponible");
    }
  };

  useEffect(() => {
    // Configuración inicial para resolver la sesión
    const setupAuth = async () => {
      try {
        console.log("[AUTH_DEBUG] Iniciando configuración de autenticación");
        
        // Intentar recuperar la sesión primero para evitar flashes de UI
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        console.log("[AUTH_DEBUG] Sesión inicial:", existingSession ? "Encontrada" : "No encontrada");
        
        if (existingSession) {
          setSession(existingSession);
          setUser(existingSession.user);
          
          const role = existingSession.user.user_metadata?.role || 
                      determineRoleFromEmail(existingSession.user.email || '');
          
          setUserRole(role);
          syncUserToLocalStorage(existingSession.user, existingSession);
          console.log("[AUTH_DEBUG] Rol establecido:", role);
        }
        
        // Establece el listener para cambios de autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, currentSession) => {
            console.log("[AUTH_DEBUG] Cambio en estado de autenticación:", event);
            
            if (currentSession) {
              setSession(currentSession);
              setUser(currentSession.user);
              
              const role = currentSession.user.user_metadata?.role || 
                          determineRoleFromEmail(currentSession.user.email || '');
              
              setUserRole(role);
              syncUserToLocalStorage(currentSession.user, currentSession);
              console.log("[AUTH_DEBUG] Nuevo rol tras cambio de estado:", role);
            } else {
              setSession(null);
              setUser(null);
              setUserRole(null);
              localStorage.removeItem('user');
              console.log("[AUTH_DEBUG] ⚠️ Sesión finalizada - Sin usuario");
            }
          }
        );
        
        // Es importante finalizar loading incluso si no hay sesión
        setAuthInitialized(true);
        setLoading(false);
        console.log("[AUTH_DEBUG] Autenticación inicializada, loading:", false);
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("[AUTH_DEBUG] Error crítico durante inicialización de autenticación:", error);
        // Asegurarse de que loading sea false incluso con errores
        setLoading(false);
        setAuthInitialized(true);
      }
    };
    
    setupAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log("[AUTH_DEBUG] Intentando iniciar sesión con:", email);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("[AUTH_DEBUG] Error de autenticación Supabase:", error.message);
        
        toast({
          title: "Error de autenticación",
          description: "Credenciales incorrectas. Si es tu primera vez, contacta al administrador.",
          variant: "destructive"
        });
        
        return { 
          error, 
          data: null
        };
      }
      
      if (!data.session) {
        console.log("[AUTH_DEBUG] ⚠️ Autenticación exitosa pero sin sesión generada");
        toast({
          title: "Error de autenticación",
          description: "No se pudo establecer sesión. Inténtalo de nuevo.",
          variant: "destructive"
        });
        
        return {
          error: new Error("No se pudo establecer la sesión"),
          data: null
        };
      }
      
      console.log("[AUTH_DEBUG] ✅ Sesión establecida correctamente");
      
      // Determinar el rol del usuario
      const role = data.user.user_metadata?.role || determineRoleFromEmail(email);
      
      // Actualizar metadata del usuario con el rol (importante para JWT claims)
      await supabase.auth.updateUser({
        data: { role }
      });
      
      console.log("[AUTH_DEBUG] Role actualizado en los metadatos del usuario:", role);
      
      // Guardar información en localStorage para compatibilidad
      const userData = {
        id: data.user.id,
        email: data.user.email,
        role: role
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      setUserRole(role);
      
      toast({
        title: "Inicio de sesión exitoso",
        description: `Bienvenido, ${email}!`,
      });
      
      return { 
        error: null, 
        data: data.session
      };
    } catch (e) {
      console.error("[AUTH_DEBUG] Error crítico en signIn:", e);
      
      toast({
        title: "Error",
        description: "Error inesperado al iniciar sesión. Inténtalo de nuevo.",
        variant: "destructive"
      });
      
      return {
        error: {
          message: "Error inesperado al iniciar sesión",
          name: "UnexpectedError",
        },
        data: null
      };
    }
  };

  const signOut = async () => {
    console.log("[AUTH_DEBUG] Cerrando sesión - Eliminando token JWT");
    try {
      // Limpiar localStorage primero por si hay problemas con Supabase
      localStorage.removeItem('user');
      localStorage.removeItem('impersonatedRole');
      
      // Intentar cerrar sesión con Supabase
      await supabase.auth.signOut();
      
      // Actualizar el estado después de cerrar sesión
      setUserRole(null);
      setUser(null);
      setSession(null);
      
      console.log("[AUTH_DEBUG] Sesión cerrada y almacenamiento local limpiado");
      
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente.",
        variant: "default"
      });
      
      return Promise.resolve();
    } catch (error) {
      console.error("[AUTH_DEBUG] Error al cerrar sesión:", error);
      
      // En caso de error, asegurar que se limpia el estado local
      setUserRole(null);
      setUser(null);
      setSession(null);
      
      toast({
        title: "Error al cerrar sesión",
        description: "Hubo un problema, pero la sesión se ha cerrado localmente.",
        variant: "destructive"
      });
      
      // Resolver la promesa incluso si hay error para no bloquear la redirección
      return Promise.resolve();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading: loading || !authInitialized,
        userRole,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
