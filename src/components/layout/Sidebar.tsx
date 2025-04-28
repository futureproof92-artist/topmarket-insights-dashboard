import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { UserCheck, Users } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
interface SidebarProps {
  user?: {
    role: string;
    email: string;
  };
  impersonatedRole?: string;
  onImpersonate?: (role: string | null) => void;
}
export const Sidebar = ({
  user,
  impersonatedRole,
  onImpersonate
}: SidebarProps) => {
  // Determine if user is admin
  const isAdmin = user?.role === 'admin' || user?.email?.includes('sergio.t@topmarket.com.mx');

  // Use the impersonated role if available, otherwise use the actual role
  const activeRole = impersonatedRole || user?.role;
  const getNavItems = (role: string) => {
    switch (role) {
      case 'evelyn':
        return [{
          name: 'Mis Ventas',
          path: '/ventas'
        }, {
          name: 'Mis Prospecciones',
          path: '/prospecciones'
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
    role: 'nataly',
    name: 'Nataly Zarate',
    description: 'Cobranza'
  }];
  const handleImpersonate = (role: string | null) => {
    if (onImpersonate) {
      onImpersonate(role);
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
                  
                </Link>
              </li>)}

            {/* Admin user impersonation section */}
            {isAdmin && <>
                <li className="pt-4">
                  <div className="flex items-center mb-2">
                    <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Ver como:</span>
                  </div>

                  {userRoles.map(userRole => <Button key={userRole.role} variant={impersonatedRole === userRole.role ? "default" : "ghost"} size="sm" className={cn("w-full justify-start text-xs mb-1", impersonatedRole === userRole.role ? "bg-primary text-primary-foreground" : "")} onClick={() => handleImpersonate(userRole.role)}>
                      <UserCheck className="h-3.5 w-3.5 mr-2" />
                      {userRole.name} ({userRole.description})
                    </Button>)}

                  {impersonatedRole && <Button variant="outline" size="sm" className="w-full justify-start mt-2 text-xs" onClick={() => handleImpersonate(null)}>
                      Volver a vista Admin
                    </Button>}
                </li>
              </>}
          </ul>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user?.email || 'Usuario no autenticado'}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {impersonatedRole ? `Viendo como: ${impersonatedRole}` : user?.role || 'Sin rol'}
            </p>
          </div>
          <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => {
          localStorage.removeItem('user');
          localStorage.removeItem('impersonatedRole');
          window.location.href = '/';
        }}>
            Cerrar sesión
          </Button>
        </div>
      </div>
    </aside>;
};