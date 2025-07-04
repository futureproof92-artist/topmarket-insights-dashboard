
import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusIcon, UserCheck } from 'lucide-react';
import { NewReportButton } from '@/components/reports/NewReportButton';

interface TopBarProps {
  user?: {
    role: string;
    email: string;
  };
  impersonatedRole?: string | null;
}

export const TopBar = ({ user, impersonatedRole }: TopBarProps) => {
  // Use the impersonated role if available, otherwise use the actual role
  const activeRole = impersonatedRole || user?.role;
  const isAdmin = user?.role === 'admin' || user?.email?.includes('sergio.t@topmarket.com.mx');
  
  // Asegurarse de que siempre haya un título, incluso si activeRole es undefined
  const pageTitle = getPageTitle(activeRole);
  
  return (
    <header className="border-b border-border p-4 flex items-center justify-between bg-background sticky top-0 z-10">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold">
          {pageTitle}
        </h1>
        
        {impersonatedRole && isAdmin && (
          <div className="ml-4 flex items-center text-sm bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
            <UserCheck className="h-3.5 w-3.5 mr-1" />
            <span>Modo edición como {getUserName(impersonatedRole)}</span>
          </div>
        )}
      </div>

      {(activeRole !== 'admin' || impersonatedRole) && (
        <NewReportButton userRole={activeRole} />
      )}
    </header>
  );
};

function getPageTitle(role?: string): string {
  switch (role) {
    case 'evelyn':
      return 'Mis Ventas & Prospecciones';
    case 'davila':
      return 'Mis PXR Cerrados';
    case 'lilia':
      return 'Mis HH Cerrados';
    case 'karla':
      return 'Karla Casillas (Reclu Interno)';
    case 'nataly':
    case 'cobranza':
      return 'Mi Cobranza';
    case 'admin':
      return 'Panel Maestro';
    default:
      return 'TopMarket Dashboard';
  }
}

function getUserName(role: string): string {
  switch (role) {
    case 'evelyn':
      return 'Eve';
    case 'davila':
      return 'Gaby Davila';
    case 'lilia':
      return 'Lilia Morales';
    case 'karla':
      return 'Karla Casillas';
    case 'nataly':
    case 'cobranza':
      return 'Nataly Zarate';
    default:
      return role;
  }
}
