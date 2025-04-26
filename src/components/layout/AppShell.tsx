
import React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface AppShellProps {
  children: React.ReactNode;
  user?: {
    role: string;
    email: string;
  };
}

export const AppShell = ({ children, user }: AppShellProps) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col">
        <TopBar user={user} />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
