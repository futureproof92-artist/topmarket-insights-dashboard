
// Re-exportamos el hook desde su ubicación original
import { useAuth as useOriginalAuth } from '@/context/AuthContext';

// Hook extendido para mejorar la autenticación y manejo de roles
export const useAuth = () => {
  const authContext = useOriginalAuth();
  
  // Obtener el email para verificaciones directas
  const userEmail = authContext.user?.email?.toLowerCase() || '';
  
  // Debug
  console.log("[AUTH_HOOK] Usuario actual:", { 
    email: userEmail, 
    role: authContext.user?.role || authContext.user?.user_metadata?.role || 'user'
  });
  
  // Verificación mejorada de permisos basada en el email directamente
  const isKarla = userEmail.includes('reclutamiento') || 
                 userEmail.includes('karla.casillas');
  
  const isDavila = userEmail.includes('rys_cdmx') || 
                  userEmail.includes('davila');
  
  const isAdmin = userEmail.includes('sergio.t@topmarket.com.mx');
  
  // Verificar acceso específico a secciones
  const hasReclutamientoAccess = isKarla || isAdmin;
  const hasPxrAccess = isDavila || isAdmin;
  
  return {
    ...authContext,
    isKarla,
    isDavila,
    isAdmin,
    hasReclutamientoAccess,
    hasPxrAccess
  };
};
