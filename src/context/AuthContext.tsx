
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
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

  useEffect(() => {
    // Set up the auth listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state changed:", event, currentSession ? "Session present" : "No session");
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log("Checking existing session:", currentSession ? "Session found" : "No session found");
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log("Intentando iniciar sesión con:", email);
    
    try {
      const response = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log("Respuesta de Supabase:", 
        response.error ? `Error: ${response.error.message}` : "Sin error",
        response.data ? "Datos disponibles" : "Sin datos"
      );
      
      // Transformamos la respuesta para que coincida con nuestra interfaz
      return {
        error: response.error,
        data: response.data.session || null
      };
    } catch (e) {
      console.error("Error inesperado en signIn:", e);
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
    console.log("Cerrando sesión");
    await supabase.auth.signOut();
    // También limpiamos localStorage para compatibilidad con el sistema anterior
    localStorage.removeItem('user');
    localStorage.removeItem('impersonatedRole');
    console.log("Sesión cerrada y almacenamiento local limpiado");
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
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
