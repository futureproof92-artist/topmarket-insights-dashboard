
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserSelectionGrid } from '@/components/auth/UserSelectionGrid';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-background">
      <div className="w-full max-w-6xl space-y-8">
        <div className="text-center space-y-2 bg-white rounded-lg p-4">
          <img 
            src="/lovable-uploads/85fa6f2d-75fa-4c02-ba50-17f13fe09eef.png" 
            alt="TopMarket Logo" 
            className="h-16 mx-auto"
          />
          <p className="text-xl text-muted-foreground">Dashboard de Reportes y Gastos</p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Selecciona tu perfil</CardTitle>
            <CardDescription>
              Cada módulo requiere credenciales específicas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserSelectionGrid />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
