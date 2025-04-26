
import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  user?: {
    role: string;
    email: string;
  };
}

export const Sidebar = ({ user }: SidebarProps) => {
  const getNavItems = (role: string) => {
    switch (role) {
      case 'evelyn':
        return [
          { name: 'Mis Ventas', path: '/ventas' },
          { name: 'Mis Prospecciones', path: '/prospecciones' },
          { name: 'Historial', path: '/historial' },
        ];
      case 'davila':
        return [
          { name: 'Mis PXR Cerrados', path: '/pxr-cerrados' },
          { name: 'Historial', path: '/historial' },
        ];
      case 'lilia':
        return [
          { name: 'Mis HH Cerrados', path: '/hh-cerrados' },
          { name: 'Historial', path: '/historial' },
        ];
      case 'nataly':
        return [
          { name: 'Mi Cobranza', path: '/cobranza' },
          { name: 'Historial', path: '/historial' },
        ];
      case 'admin':
        return [
          { name: 'Panel Maestro', path: '/admin' },
          { name: 'Gastos TDC', path: '/gastos-tdc' },
          { name: 'Usuarios', path: '/usuarios' },
          { name: 'Historial', path: '/historial' },
        ];
      default:
        return [{ name: 'Inicio', path: '/' }];
    }
  };

  const navItems = user?.role ? getNavItems(user.role) : [];

  return (
    <aside className="w-full md:w-64 bg-sidebar border-r border-border">
      <div className="flex flex-col h-full">
        <div className="p-4">
          <h2 className="text-xl font-bold text-white">TopMarket</h2>
          <p className="text-xs text-muted-foreground mt-1">Dashboard de Reportes y Gastos</p>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link to={item.path}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start hover:bg-accent"
                  >
                    {item.name}
                  </Button>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user?.email || 'Usuario no autenticado'}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role || 'Sin rol'}</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 w-full" 
            onClick={() => console.log('Cerrar sesión')}
          >
            Cerrar sesión
          </Button>
        </div>
      </div>
    </aside>
  );
};
