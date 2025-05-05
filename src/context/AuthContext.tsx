
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
    
    // Tabla de usuarios y contraseñas de respaldo para desarrollo/testing
    const fallbackUsers = {
      // Admin
      'sergio.t@topmarket.com.mx': {
        password: 'fk_2024_254_satg_280324',
        role: 'admin',
        id: 'admin-user-id',
      },
      // Evelyn (Ventas)
      'dcomercial@topmarket.com.mx': {
        password: 'jeifnAHE3HSB3',
        role: 'evelyn',
        id: 'evelyn-user-id',
      },
      // Gaby Davila (PXR Cerrados)
      'rys_cdmx@topmarket.com.mx': {
        password: 'iHFUnd838nx',
        role: 'davila',
        id: 'davila-user-id',
      },
      // Lilia Morales (HH Cerrados)
      'rlaboral@topmarket.com.mx': {
        password: 'Th8F82Nbd',
        role: 'lilia',
        id: 'lilia-user-id',
      },
      // Karla Casillas (Reclutamiento)
      'reclutamiento@topmarket.com.mx': {
        password: 'TMkc73ndj2b',
        role: 'karla',
        id: 'karla-user-id',
      },
      // Nataly Zarate (Cobranza)
      'administracion@topmarket.com.mx': {
        password: 'iE74nuy!jd',
        role: 'cobranza',
        id: 'cobranza-user-id',
      }
    };
    
    // Verificar si es un usuario de fallback
    const normalizedEmail = email.toLowerCase();
    const fallbackUser = fallbackUsers[normalizedEmail as keyof typeof fallbackUsers];
    
    if (fallbackUser && fallbackUser.password === password) {
      console.log(`Autenticación fallback exitosa para: ${normalizedEmail} con rol: ${fallbackUser.role}`);
      
      try {
        // Usar siempre una credencial real de Supabase para obtener un token JWT válido
        // Este es crucial para que los RLS policies funcionen correctamente
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: 'sergio.t@topmarket.com.mx',  // Usamos el admin como credencial base
          password: 'fk_2024_254_satg_280324',
        });
        
        if (authError) {
          console.error("Error al autenticar con Supabase:", authError.message);
          return {
            error: authError,
            data: null
          };
        }
        
        if (!authData.session) {
          console.error("No se pudo obtener sesión de Supabase");
          return {
            error: { message: "No se pudo obtener sesión de Supabase" },
            data: null
          };
        }
        
        // Crear un objeto de sesión personalizado con los datos del usuario fallback
        // pero manteniendo los tokens JWT válidos de Supabase
        const customSession = {
          ...authData.session,
          user: {
            ...authData.session.user,
            id: fallbackUser.id,
            email: normalizedEmail,
            user_metadata: {
              ...authData.session.user.user_metadata,
              role: fallbackUser.role,
            }
          }
        } as Session;
        
        // Guardar los datos del usuario en localStorage para persistencia entre recargas
        localStorage.setItem('user', JSON.stringify({
          id: fallbackUser.id,
          email: normalizedEmail,
          role: fallbackUser.role,
        }));
        
        // Registrar la sesión personalizada en el estado
        setSession(customSession);
        setUser(customSession.user as User);
        
        console.log("Sesión personalizada creada exitosamente:", customSession);
        
        return {
          error: null,
          data: customSession
        };
      } catch (e) {
        console.error("Error inesperado durante el proceso de autenticación de respaldo:", e);
        return {
          error: e,
          data: null
        };
      }
    }
    
    // Flujo de autenticación regular con Supabase si no es un usuario de fallback
    try {
      const response = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log("Respuesta de Supabase:", 
        response.error ? `Error: ${response.error.message}` : "Autenticación exitosa",
        response.data ? "Datos disponibles" : "Sin datos"
      );
      
      if (!response.error && response.data.session) {
        // Si la autenticación es exitosa, almacenamos el usuario en localStorage
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
        
        localStorage.setItem('user', JSON.stringify({
          id: response.data.session.user.id,
          email: response.data.session.user.email,
          role: role,
        }));
      }
      
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
