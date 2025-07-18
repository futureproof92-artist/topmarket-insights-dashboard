
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { UserCheck, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  user?: {
    role: string;
    email: string;
  };
  impersonatedRole?: string | null;
  onImpersonate?: (role: string | null) => void;
}

export const Sidebar = ({
  user,
  impersonatedRole,
  onImpersonate
}: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  // Determine if user is admin
  const isAdmin = user?.role === 'admin' || user?.email?.includes('sergio.t@topmarket.com.mx');

  // Use the impersonated role if available, otherwise use the actual role
  const activeRole = impersonatedRole || user?.role;
  
  // ... keep existing code (getNavItems function definition)
  const getNavItems = (role: string) => {
    switch (role) {
      case 'evelyn':
        return [{
          name: 'Mis Ventas',
          path: '/ventas'
        }];
      case 'davila':
        return [{
          name: 'Mis PXR Cerrados',
          path: '/pxr-cerrados'
        }];
      case 'lilia':
        return [{
          name: 'Mis HH Cerrados',
          path: '/hh-cerrados'
        }];
      case 'karla':
        return [{
          name: 'Karla Casillas (Reclu Interno)',
          path: '/reclutamiento'
        }];
      case 'nataly':
      case 'cobranza':
        return [{
          name: 'Mi Cobranza',
          path: '/cobranza'
        }];
      case 'admin':
        return [{
          name: 'Panel Maestro',
          path: '/admin'
        }, {
          name: 'Gastos TDC',
          path: '/gastos-tdc'
        }];
      default:
        return [{
          name: 'Inicio',
          path: '/'
        }];
    }
  };
  
  const navItems = activeRole ? getNavItems(activeRole) : [];

  // User roles for impersonation
  const userRoles = [{
    role: 'evelyn',
    name: 'Eve',
    description: 'Ventas y Prospecciones'
  }, {
    role: 'davila',
    name: 'Gaby Davila',
    description: 'PXR Cerrados'
  }, {
    role: 'lilia',
    name: 'Lilia Morales',
    description: 'HH Cerrados'
  }, {
    role: 'karla',
    name: 'Karla Casillas',
    description: 'Reclu Interno'
  }, {
    role: 'nataly',
    name: 'Nataly Zarate',
    description: 'Cobranza'
  }];
  
  const handleImpersonate = (role: string | null) => {
    if (onImpersonate) {
      onImpersonate(role);

      // Redirección automática a la página correspondiente al rol seleccionado
      if (role) {
        const targetItems = getNavItems(role);
        if (targetItems.length > 0) {
          navigate(targetItems[0].path);
        }
      } else {
        // Si se cancela la impersonación, volver a la vista de admin
        navigate('/admin');
      }
    }
  };
  
  const handleLogout = async () => {
    try {
      console.log("[AUTH_DEBUG] Iniciando proceso de cierre de sesión desde Sidebar");
      
      // Limpiar cualquier dato de impersonación
      if (onImpersonate && impersonatedRole) {
        onImpersonate(null);
      }
      
      // Llamar a signOut y esperar a que termine
      await signOut();
      
      // Forzar limpieza adicional de localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('impersonatedRole');
      
      // Redirección forzada con replace:true para prevenir navegación hacia atrás
      console.log("[AUTH_DEBUG] Redirigiendo a página principal después de cerrar sesión");
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 0);
    } catch (error) {
      console.error("[AUTH_DEBUG] Error al cerrar sesión:", error);
      
      // Intentar redirección incluso si hay un error
      console.log("[AUTH_DEBUG] Intentando redirección forzada por error");
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 0);
    }
  };

  return <aside className="w-full md:w-64 bg-sidebar border-r border-border">
    <div className="flex flex-col h-full">
      <div className="p-4">
        <h2 className="text-xl font-bold text-white">TopMarket</h2>
        <p className="text-xs text-muted-foreground mt-1">Dashboard de Reportes y Gastos</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map(item => <li key={item.path}>
            <Link to={item.path}>
              <Button 
                variant="ghost" 
                className={cn(
                  "w-full justify-start text-sm text-white hover:text-white",
                  location.pathname === item.path && "bg-sidebar-accent text-white"
                )} 
                asChild
              >
                <span>{item.name}</span>
              </Button>
            </Link>
          </li>)}

          {/* Admin user impersonation section */}
          {isAdmin && <li className="pt-4">
            <div className="flex items-center mb-2">
              <Users className="h-4 w-4 mr-2 text-white" />
              <span className="text-sm font-medium text-white">Ver como:</span>
            </div>

            {userRoles.map(userRole => <Button key={userRole.role} variant={impersonatedRole === userRole.role ? "default" : "ghost"} size="sm" className={cn("w-full justify-start text-xs mb-1", impersonatedRole === userRole.role ? "bg-primary text-primary-foreground" : "text-white hover:text-white")} onClick={() => handleImpersonate(userRole.role)}>
              <UserCheck className="h-3.5 w-3.5 mr-2" />
              {userRole.name} ({userRole.description})
            </Button>)}

            {impersonatedRole && <Button variant="outline" size="sm" onClick={() => handleImpersonate(null)} className="w-full justify-start mt-2 text-xs border-white hover:bg-sidebar-accent text-slate-500">
              Volver a vista Admin
            </Button>}
          </li>}
        </ul>
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex flex-col space-y-1">
          <p className="text-sm font-medium text-white">{user?.email || 'Usuario no autenticado'}</p>
          <p className="text-xs text-gray-400 capitalize">
            {impersonatedRole ? `Viendo como: ${impersonatedRole}` : user?.role || 'Sin rol'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout} className="mt-2 w-full border-white hover:bg-sidebar-accent text-zinc-900">
          Cerrar sesión
        </Button>
      </div>
    </div>
  </aside>;
};
