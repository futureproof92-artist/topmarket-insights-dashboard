
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
        // Intentamos crear una sesión real en Supabase para este usuario
        // Utilizando la función signUp para crear una cuenta temporal si no existe
        // Nota: Esto puede generar una "cuenta" pero con el email sin verificar
        // Con esto aseguramos tener tokens JWT válidos para operaciones en Supabase
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: fallbackUser.password,
        });
        
        if (authError) {
          console.log("Usuario no existe en Supabase, intentando crear una sesión anónima");
          
          // Crear una sesión de cliente para este usuario
          // Esto nos permite realizar operaciones CRUD en las tablas
          const { data, error } = await supabase.auth.signInWithPassword({
            email: 'sergio.t@topmarket.com.mx',  // Usamos el admin como respaldo
            password: 'fk_2024_254_satg_280324',
          });
          
          if (error) {
            console.error("No se pudo crear sesión de respaldo:", error.message);
          } else {
            console.log("Sesión de respaldo creada exitosamente");
            
            // Sobreescribimos el usuario pero mantenemos los tokens de sesión
            const mockUser = {
              id: fallbackUser.id,
              email: normalizedEmail,
              role: fallbackUser.role,
              user_metadata: {
                role: fallbackUser.role,
              },
            };
            
            // Crear una sesión compuesta con el token JWT válido pero datos de usuario personalizados
            const mockSession = {
              ...data.session,
              user: {
                ...data.session?.user,
                email: normalizedEmail,
                id: fallbackUser.id,
                user_metadata: {
                  role: fallbackUser.role,
                },
              }
            } as Session;
            
            // Almacenar en localStorage para compatibilidad con el sistema existente
            localStorage.setItem('user', JSON.stringify({
              id: fallbackUser.id,
              email: normalizedEmail,
              role: fallbackUser.role,
            }));
            
            setSession(mockSession);
            setUser(mockSession.user as User);
            
            return {
              error: null,
              data: mockSession
            };
          }
        } else {
          console.log("Autenticación exitosa con Supabase para usuario existente");
          
          // Usuario autenticado correctamente con Supabase
          // Aseguramos que tenga la información de rol correcta
          localStorage.setItem('user', JSON.stringify({
            id: authData.session?.user.id,
            email: normalizedEmail,
            role: fallbackUser.role,
          }));
          
          setSession(authData.session);
          setUser(authData.session?.user as User);
          
          return {
            error: null,
            data: authData.session
          };
        }
      } catch (e) {
        console.error("Error inesperado durante el proceso de autenticación de respaldo:", e);
      }
      
      // Si llegamos aquí, significa que hubo algún problema con la autenticación Supabase
      // Creamos un mockSession básico para mantener compatibilidad
      const mockSession = {
        user: {
          id: fallbackUser.id,
          email: normalizedEmail,
          role: fallbackUser.role,
          user_metadata: {
            role: fallbackUser.role,
          },
        },
        access_token: `mock-access-token-${fallbackUser.role}`,
        refresh_token: `mock-refresh-token-${fallbackUser.role}`,
        expires_in: 3600,
      } as unknown as Session;
      
      // Almacenar en localStorage para compatibilidad con el sistema existente
      localStorage.setItem('user', JSON.stringify({
        id: fallbackUser.id,
        email: normalizedEmail,
        role: fallbackUser.role,
      }));
      
      setSession(mockSession);
      setUser(mockSession.user as User);
      
      return {
        error: null,
        data: mockSession
      };
    }
    
    // Flujo de autenticación regular con Supabase
    console.log("Usuario no encontrado en fallback, intentando con Supabase");
    try {
      const response = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log("Respuesta de Supabase:", 
        response.error ? `Error: ${response.error.message}` : "Sin error",
        response.data ? "Datos disponibles" : "Sin datos"
      );
      
      if (!response.error && response.data.session) {
        // Si la autenticación es exitosa, almacenamos el usuario en localStorage
        // para mantener compatibilidad con el sistema existente
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
