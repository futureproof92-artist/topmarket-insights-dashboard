
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  userRole: string | null;
  isSessionValid: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: any | null;
    data: Session | null;
  }>;
  signOut: () => Promise<void>;
  validateSession: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [isSessionValid, setIsSessionValid] = useState(false);
  const { toast } = useToast();

  // Determine role based on the email (ACTUALIZADO para coincidir con RLS)
  const determineRoleFromEmail = (email: string): string => {
    if (!email) return 'user';
    
    email = email.toLowerCase();
    
    // Admin tiene prioridad máxima
    if (email.includes('sergio.t@topmarket.com.mx')) {
      return 'admin';
    } else if (email.includes('reclutamiento') || email.includes('karla.casillas')) {
      return 'karla';
    } else if (email.includes('rys_cdmx') || email.includes('davila')) {
      return 'davila';
    } else if (email.includes('rlaboral') || email.includes('lilia')) {
      return 'lilia';
    } else if (email.includes('administracion') || email.includes('cobranza')) {
      return 'cobranza';
    }
    return 'user';
  };

  // Clean up any stale auth state from localStorage
  const cleanupAuthState = () => {
    // Remove all Supabase auth keys from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
  };

  // Synchronize the state of the user with localStorage for maintaining compatibility
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

    // Log JWT token for diagnostic
    if (currentSession) {
      const createdAt = new Date().toLocaleString();
      console.log("[AUTH_DEBUG] Token JWT disponible:", !!currentSession.access_token);
      console.log("[AUTH_DEBUG] Estado del token (RLS compatible):", {
        email: currentUser.email,
        role: role,
        emitido: createdAt,
        expira: new Date(currentSession.expires_at * 1000).toLocaleString(),
        tiempoRestante: Math.round((currentSession.expires_at - Date.now()/1000)/60) + " minutos"
      });
    } else {
      console.log("[AUTH_DEBUG] ⚠️ No hay token JWT disponible");
    }
  };

  // New centralized function to validate JWT sessions
  const validateSession = async (): Promise<boolean> => {
    console.log("[AUTH_DEBUG] Iniciando validación centralizada de sesión JWT");
    
    if (!session || !user) {
      console.log("[AUTH_DEBUG] No hay sesión o usuario para validar");
      setIsSessionValid(false);
      return false;
    }
    
    // Verify that the token is valid
    if (!session.access_token || !session.access_token.startsWith("ey")) {
      console.log("[AUTH_DEBUG] ⚠️ Token JWT inválido detectado");
      setIsSessionValid(false);
      return false;
    }
    
    // Verify if the token has expired
    const tokenExpiration = session.expires_at * 1000;
    const timeRemaining = Math.round((tokenExpiration - Date.now())/60000);
    
    console.log("[AUTH_DEBUG] Validación de sesión JWT (RLS compatible):", {
      userId: user.id,
      email: user.email,
      role: userRole,
      tokenActivo: !!session.access_token,
      expira: new Date(tokenExpiration).toLocaleString(),
      tiempoRestante: timeRemaining + " minutos",
    });
    
    if (Date.now() >= tokenExpiration) {
      console.log("[AUTH_DEBUG] ⚠️ Token JWT expirado");
      setIsSessionValid(false);
      return false;
    }
    
    // If we are less than 10 minutes from expiring, we warn but it's still valid
    if (timeRemaining < 10) {
      console.log("[AUTH_DEBUG] ⚠️ Token JWT a punto de expirar");
    }
    
    setIsSessionValid(true);
    return true;
  };

  useEffect(() => {
    // Initial setup to resolve the session
    const setupAuth = async () => {
      try {
        console.log("[AUTH_DEBUG] Iniciando configuración de autenticación");
        
        // Clean up any stale auth state first
        cleanupAuthState();
        
        // Try to recover the session first to avoid UI flashes
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
          
          // Validate the session immediately
          await validateSession();
        }
        
        // Set up the listener for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, currentSession) => {
            console.log("[AUTH_DEBUG] Cambio en estado de autenticación:", event);
            
            if (currentSession) {
              setSession(currentSession);
              setUser(currentSession.user);
              
              const role = currentSession.user.user_metadata?.role || 
                          determineRoleFromEmail(currentSession.user.email || '');
              
              setUserRole(role);
              syncUserToLocalStorage(currentSession.user, currentSession);
              console.log("[AUTH_DEBUG] Nuevo rol tras cambio de estado:", role);
              
              // Validate the session automatically after each change
              await validateSession();
            } else {
              setSession(null);
              setUser(null);
              setUserRole(null);
              setIsSessionValid(false);
              localStorage.removeItem('user');
              console.log("[AUTH_DEBUG] ⚠️ Sesión finalizada - Sin usuario");
            }
          }
        );
        
        // Important to end loading even if there is no session
        setAuthInitialized(true);
        setLoading(false);
        console.log("[AUTH_DEBUG] Autenticación inicializada, loading:", false);
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("[AUTH_DEBUG] Error crítico durante inicialización de autenticación:", error);
        // Ensure loading is false even with errors
        setLoading(false);
        setAuthInitialized(true);
        setIsSessionValid(false);
      }
    };
    
    setupAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log("[AUTH_DEBUG] Intentando iniciar sesión con:", email);
    
    try {
      // Clean up existing auth state first
      cleanupAuthState();
      
      // Attempt global sign out to ensure clean state
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }
      
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
      
      // Determine user role (ACTUALIZADO para coincidir con RLS)
      const role = data.user.user_metadata?.role || determineRoleFromEmail(email);
      
      // Update user metadata with role (important for JWT claims)
      await supabase.auth.updateUser({
        data: { role }
      });
      
      console.log("[AUTH_DEBUG] Role actualizado en los metadatos del usuario (RLS compatible):", role);
      
      // Save information in localStorage for compatibility
      const userData = {
        id: data.user.id,
        email: data.user.email,
        role: role
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      setUserRole(role);
      
      // Validate the new session
      await validateSession();
      
      toast({
        title: "Inicio de sesión exitoso",
        description: `Bienvenido, ${email}! Rol: ${role}`,
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
      // Clean localStorage first in case there's an issue with Supabase
      cleanupAuthState();
      
      // Try to sign out with Supabase
      await supabase.auth.signOut();
      
      // Update state after signing out
      setUserRole(null);
      setUser(null);
      setSession(null);
      setIsSessionValid(false);
      
      console.log("[AUTH_DEBUG] Sesión cerrada y almacenamiento local limpiado");
      
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente.",
        variant: "default"
      });
      
      return Promise.resolve();
    } catch (error) {
      console.error("[AUTH_DEBUG] Error al cerrar sesión:", error);
      
      // In case of error, ensure local state is cleared
      setUserRole(null);
      setUser(null);
      setSession(null);
      setIsSessionValid(false);
      
      toast({
        title: "Error al cerrar sesión",
        description: "Hubo un problema, pero la sesión se ha cerrado localmente.",
        variant: "destructive"
      });
      
      // Resolve the promise even if there's an error to avoid blocking redirection
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
        isSessionValid,
        signIn,
        signOut,
        validateSession,
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
