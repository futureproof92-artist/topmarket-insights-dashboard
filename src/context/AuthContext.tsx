
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
  };

  useEffect(() => {
    // Configuración inicial para resolver la sesión
    const setupAuth = async () => {
      try {
        // Verifica si hay un usuario existente en localStorage para UI inicial
        const storedUser = localStorage.getItem('user');
        let initialRole = null;
        
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            initialRole = parsedUser.role;
            // No establecemos el usuario aquí, esperamos a Supabase
          } catch (e) {
            console.error("Error parsing stored user:", e);
          }
        }
        
        // Establece el listener para cambios de autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, currentSession) => {
            console.log("Auth state changed:", event, currentSession ? "Session present" : "No session");
            
            if (currentSession) {
              setSession(currentSession);
              setUser(currentSession.user);
              
              // Actualizar user_metadata con el rol si no existe
              const role = currentSession.user.user_metadata?.role || 
                           determineRoleFromEmail(currentSession.user.email || '');
              
              if (!currentSession.user.user_metadata?.role) {
                // Actualizar los metadatos del usuario con el rol
                supabase.auth.updateUser({
                  data: { role: role }
                }).then(({ data, error }) => {
                  if (error) {
                    console.error("Error updating user metadata:", error);
                  } else if (data.user) {
                    console.log("Updated user metadata with role:", role);
                    setUser(data.user);
                  }
                });
              }
              
              setUserRole(role);
              syncUserToLocalStorage(currentSession.user, currentSession);
            } else {
              setSession(null);
              setUser(null);
              setUserRole(null);
            }
          }
        );
        
        // Verificar si hay una sesión existente
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        console.log("Existing session check:", existingSession ? "Found session" : "No session");
        
        if (existingSession) {
          setSession(existingSession);
          setUser(existingSession.user);
          
          const role = existingSession.user.user_metadata?.role || 
                      determineRoleFromEmail(existingSession.user.email || '');
          
          setUserRole(role);
          syncUserToLocalStorage(existingSession.user, existingSession);
        } else if (storedUser) {
          // Si hay un usuario en localStorage pero no hay sesión,
          // intentamos recuperarla con credenciales almacenadas
          try {
            const parsedUser = JSON.parse(storedUser);
            console.log("Attempting to restore session for user:", parsedUser.email);
            
            // Intenta iniciar sesión automáticamente si tenemos las credenciales
            if (parsedUser.email === 'sergio.t@topmarket.com.mx') {
              await signIn('sergio.t@topmarket.com.mx', 'fk_2024_254_satg_280324');
            } else if (parsedUser.email === 'dcomercial@topmarket.com.mx') {
              await signIn('dcomercial@topmarket.com.mx', 'jeifnAHE3HSB3');
            } else if (parsedUser.email === 'rys_cdmx@topmarket.com.mx') {
              await signIn('rys_cdmx@topmarket.com.mx', 'iHFUnd838nx');
            } else if (parsedUser.email === 'rlaboral@topmarket.com.mx') {
              await signIn('rlaboral@topmarket.com.mx', 'Th8F82Nbd');
            } else if (parsedUser.email === 'reclutamiento@topmarket.com.mx') {
              await signIn('reclutamiento@topmarket.com.mx', 'TMkc73ndj2b');
            } else if (parsedUser.email === 'administracion@topmarket.com.mx') {
              await signIn('administracion@topmarket.com.mx', 'iE74nuy!jd');
            }
            // Si la sesión no se restaura, se manejará en el flujo normal
          } catch (error) {
            console.error("Error restoring session:", error);
            localStorage.removeItem('user');
          }
        }
        
        setLoading(false);
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error during auth initialization:", error);
        setLoading(false);
      }
    };
    
    setupAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log("Intentando iniciar sesión con:", email);
    
    try {
      // Intentar autenticación con Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Error de autenticación:", error.message);
        
        // Fallback para usuarios predeterminados si falla la autenticación
        const fallbackUsers = {
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
        
        const normalizedEmail = email.toLowerCase();
        const fallbackUser = fallbackUsers[normalizedEmail as keyof typeof fallbackUsers];
        
        if (fallbackUser && fallbackUser.password === password) {
          console.log(`Usando credenciales de respaldo para: ${normalizedEmail}`);
          
          // Intentar crear un nuevo usuario en Supabase para la próxima vez
          try {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: normalizedEmail,
              password: password,
              options: {
                data: {
                  role: fallbackUser.role
                }
              }
            });
            
            if (signUpError) {
              console.error("Error al crear usuario en Supabase:", signUpError);
            } else if (signUpData.session) {
              console.log("Usuario creado exitosamente en Supabase");
              
              // Guardar la información del usuario
              const userData = {
                id: signUpData.user?.id,
                email: normalizedEmail,
                role: fallbackUser.role
              };
              
              localStorage.setItem('user', JSON.stringify(userData));
              
              toast({
                title: "Inicio de sesión exitoso",
                description: `Bienvenido, ${normalizedEmail}!`,
              });
              
              return {
                error: null,
                data: signUpData.session
              };
            }
          } catch (e) {
            console.error("Error en el proceso de registro:", e);
          }
          
          return {
            error: new Error("Error al iniciar sesión. Intenta más tarde."),
            data: null
          };
        } else {
          toast({
            title: "Error de autenticación",
            description: "Credenciales incorrectas. Inténtalo de nuevo.",
            variant: "destructive"
          });
          
          return { error, data: null };
        }
      }
      
      if (!data.session) {
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
      
      return { error: null, data: data.session };
    } catch (e) {
      console.error("Error inesperado en signIn:", e);
      
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
    console.log("Cerrando sesión");
    await supabase.auth.signOut();
    // También limpiamos localStorage para compatibilidad con el sistema anterior
    localStorage.removeItem('user');
    localStorage.removeItem('impersonatedRole');
    setUserRole(null);
    console.log("Sesión cerrada y almacenamiento local limpiado");
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
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
