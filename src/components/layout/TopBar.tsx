
import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import { NewReportButton } from '@/components/reports/NewReportButton';

interface TopBarProps {
  user?: {
    role: string;
    email: string;
  };
}

export const TopBar = ({ user }: TopBarProps) => {
  return (
    <header className="border-b border-border p-4 flex items-center justify-between bg-background">
      <div>
        <h1 className="text-lg font-semibold">
          {getPageTitle(user?.role)}
        </h1>
      </div>

      {user && user.role !== 'admin' && (
        <NewReportButton userRole={user.role} />
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
    case 'nataly':
      return 'Mi Cobranza';
    case 'admin':
      return 'Panel Maestro';
    default:
      return 'TopMarket Dashboard';
  }
}
