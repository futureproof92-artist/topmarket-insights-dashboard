
// Re-exportamos el hook desde su ubicación original
import { useAuth as useOriginalAuth } from '@/context/AuthContext';

// Hook extendido para mejorar la autenticación y manejo de roles
export const useAuth = () => {
  const authContext = useOriginalAuth();
  
  // Verificación mejorada de permisos para Karla
  const isKarla = authContext.user?.email?.toLowerCase().includes('reclutamiento') || 
                 authContext.user?.email?.toLowerCase().includes('karla.casillas') ||
                 authContext.userRole === 'karla';
  
  const isAdmin = authContext.userRole === 'admin' || 
                 authContext.user?.email?.toLowerCase().includes('sergio.t@topmarket.com.mx');
  
  // Verificar acceso específico a la sección de reclutamiento
  const hasReclutamientoAccess = isKarla || isAdmin;
  
  return {
    ...authContext,
    isKarla,
    isAdmin,
    hasReclutamientoAccess
  };
};
