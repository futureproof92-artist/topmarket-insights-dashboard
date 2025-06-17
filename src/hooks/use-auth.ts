
// Re-exportamos el hook desde su ubicación original
import { useAuth as useOriginalAuth } from '@/context/AuthContext';

// Hook extendido para mejorar la autenticación y manejo de roles
export const useAuth = () => {
  const authContext = useOriginalAuth();
  
  // Obtener el email para verificaciones directas (compatible con RLS)
  const userEmail = authContext.user?.email?.toLowerCase() || '';
  
  // Debug - mostrar información de usuario compatible con RLS
  console.log("[AUTH_HOOK] Usuario actual (RLS compatible):", { 
    email: userEmail, 
    role: authContext.user?.role || authContext.user?.user_metadata?.role || 'user'
  });
  
  // Verificación mejorada de permisos basada en el email directamente
  // IMPORTANTE: Estos patrones deben coincidir EXACTAMENTE con las políticas RLS
  const isAdmin = userEmail.includes('sergio.t@topmarket.com.mx');
  
  const isKarla = userEmail.includes('reclutamiento') || 
                 userEmail.includes('karla.casillas');
  
  const isDavila = userEmail.includes('rys_cdmx') || 
                  userEmail.includes('davila');
  
  const isLilia = userEmail.includes('rlaboral') ||
                 userEmail.includes('lilia');
  
  const isCobranza = userEmail.includes('administracion') ||
                    userEmail.includes('cobranza');
  
  // Verificar acceso específico a secciones
  const hasReclutamientoAccess = isKarla || isAdmin;
  const hasPxrAccess = isDavila || isAdmin;
  const hasHhAccess = isLilia || isAdmin;
  const hasCobranzaAccess = isCobranza || isAdmin;
  
  return {
    ...authContext,
    isAdmin,
    isKarla,
    isDavila, 
    isLilia,
    isCobranza,
    hasReclutamientoAccess,
    hasPxrAccess,
    hasHhAccess,
    hasCobranzaAccess
  };
};
