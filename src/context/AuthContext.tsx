
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
    source: 'supabase' | 'fallback';
  }>;
  signOut: () => Promise<void>;
};

type FallbackCredentials = {
  password: string;
  role: string;
};

type FallbackCredentialsMap = {
  [email: string]: FallbackCredentials;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Credenciales de respaldo locales (mantienen compatibilidad con el sistema anterior)
const fallbackCredentials: FallbackCredentialsMap = {
  'sergio.t@topmarket.com.mx': {
    password: 'fk_2024_254_satg_280324',
    role: 'admin',
  },
  'dcomercial@topmarket.com.mx': {
    password: 'jeifnAHE3HSB3',
    role: 'evelyn',
  },
  'rys_cdmx@topmarket.com.mx': {
    password: 'iHFUnd838nx',
    role: 'davila',
  },
  'rlaboral@topmarket.com.mx': {
    password: 'Th8F82Nbd',
    role: 'lilia',
  },
  'reclutamiento@topmarket.com.mx': {
    password: 'TMkc73ndj2b',
    role: 'karla',
  },
  'administracion@topmarket.com.mx': {
    password: 'iE74nuy!jd',
    role: 'cobranza',
  }
};

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

  // Función para manejar autenticación con credenciales de fallback
  const handleFallbackAuth = (email: string, password: string) => {
    const normalizedEmail = email.toLowerCase();
    const fallbackUser = fallbackCredentials[normalizedEmail];
    
    if (fallbackUser && fallbackUser.password === password) {
      console.log(`[AUTH_DEBUG] Usando credenciales de respaldo para: ${normalizedEmail}`);
      
      // Crear datos de usuario simulados
      const userData = {
        id: `fallback-${Date.now()}`,
        email: normalizedEmail,
        role: fallbackUser.role
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      setUserRole(fallbackUser.role);
      
      // Aunque no hay sesión real de Supabase, creamos un objeto de usuario para la app
      const mockUser = {
        id: userData.id,
        email: normalizedEmail,
        user_metadata: { role: fallbackUser.role }
      } as User;
      
      setUser(mockUser);
      
      return {
        error: null,
        data: null, // No hay sesión real
        source: 'fallback' as const
      };
    }
    
    return {
      error: { message: 'Credenciales incorrectas (fallback)' },
      data: null,
      source: 'fallback' as const
    };
  };

  useEffect(() => {
    // Configuración inicial para resolver la sesión
    const setupAuth = async () => {
      try {
        console.log("[AUTH_DEBUG] Iniciando configuración de autenticación");
        
        // Verifica si hay un usuario existente en localStorage para UI inicial
        const storedUser = localStorage.getItem('user');
        let initialRole = null;
        
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            initialRole = parsedUser.role;
            console.log("[AUTH_DEBUG] Usuario encontrado en localStorage:", parsedUser.email, "con rol:", parsedUser.role);
          } catch (e) {
            console.error("[AUTH_DEBUG] Error al analizar usuario almacenado:", e);
          }
        }
        
        // Establece el listener para cambios de autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, currentSession) => {
            console.log("[AUTH_DEBUG] Cambio en estado de autenticación:", event, currentSession ? "Sesión presente" : "Sin sesión");
            
            if (currentSession) {
              setSession(currentSession);
              setUser(currentSession.user);
              
              // Log JWT token tras cambio de estado
              console.log("[AUTH_DEBUG] Evento de autenticación:", event);
              console.log("[AUTH_DEBUG] Token JWT actualizado:", !!currentSession.access_token);
              
              // Actualizar user_metadata con el rol si no existe
              const role = currentSession.user.user_metadata?.role || 
                           determineRoleFromEmail(currentSession.user.email || '');
              
              if (!currentSession.user.user_metadata?.role) {
                // Actualizar los metadatos del usuario con el rol
                supabase.auth.updateUser({
                  data: { role: role }
                }).then(({ data, error }) => {
                  if (error) {
                    console.error("[AUTH_DEBUG] Error al actualizar metadatos del usuario:", error);
                  } else if (data.user) {
                    console.log("[AUTH_DEBUG] Metadatos de usuario actualizados con rol:", role);
                    setUser(data.user);
                  }
                });
              }
              
              setUserRole(role);
              syncUserToLocalStorage(currentSession.user, currentSession);
            } else {
              // Solo limpiar la sesión si no estamos en modo de autenticación fallback
              const fallbackUser = localStorage.getItem('user');
              if (!fallbackUser || fallbackUser.includes('"id":"fallback-')) {
                setSession(null);
                setUser(null);
                setUserRole(null);
                console.log("[AUTH_DEBUG] ⚠️ Sesión finalizada - No hay token JWT");
              } else {
                console.log("[AUTH_DEBUG] Manteniendo usuario fallback aunque no hay sesión Supabase");
              }
            }
          }
        );
        
        // Verificar si hay una sesión existente
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        console.log("[AUTH_DEBUG] Verificación de sesión existente:", existingSession ? "Sesión encontrada" : "Sin sesión");
        
        if (existingSession) {
          const createdAt = new Date().toLocaleString(); // Fallback para created_at
          console.log("[AUTH_DEBUG] Token JWT inicial:", !!existingSession.access_token);
          console.log("[AUTH_DEBUG] Datos de sesión:", {
            userId: existingSession.user.id,
            email: existingSession.user.email,
            emitido: createdAt,
            expira: new Date(existingSession.expires_at * 1000).toLocaleString(),
            tiempoRestante: Math.round((existingSession.expires_at - Date.now()/1000)/60) + " minutos"
          });
          
          setSession(existingSession);
          setUser(existingSession.user);
          
          const role = existingSession.user.user_metadata?.role || 
                      determineRoleFromEmail(existingSession.user.email || '');
          
          setUserRole(role);
          syncUserToLocalStorage(existingSession.user, existingSession);
        } else if (storedUser) {
          console.log("[AUTH_DEBUG] ⚠️ Usuario en localStorage pero sin sesión activa");
          
          try {
            const parsedUser = JSON.parse(storedUser);
            // En lugar de hacer un login automático (que puede fallar),
            // simplemente configuramos el usuario fallback si es válido
            if (Object.keys(fallbackCredentials).includes(parsedUser.email)) {
              console.log("[AUTH_DEBUG] Restaurando usuario fallback:", parsedUser.email);
              setUser({
                id: parsedUser.id,
                email: parsedUser.email,
                user_metadata: { role: parsedUser.role }
              } as User);
              setUserRole(parsedUser.role);
            }
          } catch (error) {
            console.error("[AUTH_DEBUG] Error al restaurar sesión:", error);
            localStorage.removeItem('user');
          }
        }
        
        setAuthInitialized(true);
        setLoading(false);
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("[AUTH_DEBUG] Error crítico durante inicialización de autenticación:", error);
        setLoading(false);
        setAuthInitialized(true);
      }
    };
    
    setupAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log("[AUTH_DEBUG] Intentando iniciar sesión con:", email);
    
    try {
      // Primero intentar autenticación con Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("[AUTH_DEBUG] Error de autenticación Supabase:", error.message);
        
        // Si falla Supabase, intentar con el sistema de fallback
        const fallbackResult = handleFallbackAuth(email, password);
        
        if (!fallbackResult.error) {
          console.log("[AUTH_DEBUG] Autenticación fallback exitosa para:", email);
          
          // Intentar crear un usuario en Supabase para la próxima vez
          try {
            console.log("[AUTH_DEBUG] Intentando crear usuario en Supabase para futuras sesiones");
            await supabase.auth.signUp({
              email: email,
              password: password,
              options: {
                data: {
                  role: fallbackResult.data?.user?.role || fallbackCredentials[email.toLowerCase()]?.role
                }
              }
            });
            // No verificamos el resultado aquí, solo es un intento que puede fallar
          } catch (e) {
            console.error("[AUTH_DEBUG] Error al intentar crear usuario en Supabase:", e);
          }
          
          toast({
            title: "Inicio de sesión exitoso",
            description: `Bienvenido, ${email}! (modo de compatibilidad)`,
          });
          
          return fallbackResult;
        }
        
        toast({
          title: "Error de autenticación",
          description: "Credenciales incorrectas. Inténtalo de nuevo.",
          variant: "destructive"
        });
        
        return { 
          error, 
          data: null,
          source: 'supabase' as const 
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
          data: null,
          source: 'supabase' as const
        };
      }
      
      console.log("[AUTH_DEBUG] ✅ Sesión establecida correctamente");
      console.log("[AUTH_DEBUG] Token JWT:", !!data.session.access_token);
      console.log("[AUTH_DEBUG] Duración de token:", Math.round((data.session.expires_at - Date.now()/1000)/60) + " minutos");
      
      // Determinar el rol del usuario
      const role = data.user.user_metadata?.role || determineRoleFromEmail(email);
      
      // Actualizar metadata si es necesario
      if (!data.user.user_metadata?.role) {
        await supabase.auth.updateUser({
          data: { role }
        });
      }
      
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
        data: data.session,
        source: 'supabase' as const 
      };
    } catch (e) {
      console.error("[AUTH_DEBUG] Error crítico en signIn:", e);
      
      // Como último recurso, intentar con sistema fallback
      const fallbackResult = handleFallbackAuth(email, password);
      
      if (!fallbackResult.error) {
        return fallbackResult;
      }
      
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
        data: null,
        source: 'supabase' as const
      };
    }
  };

  const signOut = async () => {
    console.log("[AUTH_DEBUG] Cerrando sesión - Eliminando token JWT");
    await supabase.auth.signOut();
    // También limpiamos localStorage para compatibilidad con el sistema anterior
    localStorage.removeItem('user');
    localStorage.removeItem('impersonatedRole');
    setUserRole(null);
    setUser(null);
    setSession(null);
    console.log("[AUTH_DEBUG] Sesión cerrada y almacenamiento local limpiado");
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
