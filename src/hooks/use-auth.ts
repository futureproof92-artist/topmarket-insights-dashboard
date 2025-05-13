
// Re-exportamos el hook desde su ubicación original
import { useAuth as useOriginalAuth } from '@/context/AuthContext';

// Hook extendido para mejorar la autenticación y manejo de roles
export const useAuth = () => {
  const authContext = useOriginalAuth();
  
  // Obtener el email para verificaciones directas
  const userEmail = authContext.user?.email?.toLowerCase() || '';
  
  // Verificación mejorada de permisos basada en el email directamente
  const isKarla = userEmail.includes('reclutamiento') || 
                 userEmail.includes('karla.casillas');
  
  const isAdmin = userEmail.includes('sergio.t@topmarket.com.mx');
  
  // Verificar acceso específico a la sección de reclutamiento
  const hasReclutamientoAccess = isKarla || isAdmin;
  
  return {
    ...authContext,
    isKarla,
    isAdmin,
    hasReclutamientoAccess
  };
};
