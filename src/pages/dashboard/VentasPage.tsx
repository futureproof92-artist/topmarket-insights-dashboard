
import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { ChartContainer } from '@/components/dashboard/ChartContainer';
import { KpiTable } from '@/components/dashboard/KpiTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Datos simulados
const mockData = {
  ventasRecords: [
    { id: '1', fecha: '2023-04-01', monto: 15000, detalles: 'Venta servicio mensual' },
    { id: '2', fecha: '2023-04-05', monto: 25000, detalles: 'Venta proyecto especial' },
    { id: '3', fecha: '2023-04-10', monto: 18000, detalles: 'Renovación contrato' },
  ],
  prospeccionesRecords: [
    { id: '1', fecha: '2023-04-02', monto: 3, detalles: 'Prospección nuevos clientes' },
    { id: '2', fecha: '2023-04-08', monto: 5, detalles: 'Reuniones agendadas' },
    { id: '3', fecha: '2023-04-15', monto: 4, detalles: 'Llamadas realizadas' },
  ],
  chartData: [
    { name: 'Ene', ventas: 45000, prospectos: 8 },
    { name: 'Feb', ventas: 52000, prospectos: 10 },
    { name: 'Mar', ventas: 49000, prospectos: 12 },
    { name: 'Abr', ventas: 58000, prospectos: 15 },
  ]
};

const VentasPage = () => {
  const [user, setUser] = useState<{ role: string; email: string } | null>(null);
  
  useEffect(() => {
    // Obtener el usuario del localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const totalVentas = mockData.ventasRecords.reduce((sum, record) => sum + record.monto, 0);
  const totalProspecciones = mockData.prospeccionesRecords.reduce((sum, record) => sum + record.monto, 0);

  if (!user) {
    return <div>Cargando...</div>;
  }

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <DashboardCard
            title="Total Ventas"
            value={`$${totalVentas.toLocaleString('es-MX')}`}
            description="Suma de todas las ventas del mes"
            trend={{ value: 12, isPositive: true }}
          />
          <DashboardCard
            title="Total Prospecciones"
            value={totalProspecciones}
            description="Número total de prospectos"
            trend={{ value: 8, isPositive: true }}
          />
        </div>
        
        <ChartContainer
          title="Resumen Mensual"
          data={mockData.chartData}
          series={[
            { name: 'Ventas ($)', dataKey: 'ventas', color: '#0045FF' },
          ]}
          type="line"
        />
        
        <Tabs defaultValue="ventas" className="w-full">
          <TabsList>
            <TabsTrigger value="ventas">Ventas</TabsTrigger>
            <TabsTrigger value="prospecciones">Prospecciones</TabsTrigger>
          </TabsList>
          <TabsContent value="ventas">
            <KpiTable 
              data={mockData.ventasRecords} 
              title="Historial de Ventas" 
              onExportCSV={() => console.log('Export CSV ventas')}
            />
          </TabsContent>
          <TabsContent value="prospecciones">
            <KpiTable 
              data={mockData.prospeccionesRecords} 
              title="Historial de Prospecciones" 
              onExportCSV={() => console.log('Export CSV prospecciones')}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
};

export default VentasPage;
