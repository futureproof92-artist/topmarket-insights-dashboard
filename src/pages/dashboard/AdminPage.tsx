import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { ChartContainer } from '@/components/dashboard/ChartContainer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KpiTable } from '@/components/dashboard/KpiTable';

// Datos simulados
const mockData = {
  ventasTotal: 250000,
  pxrTotal: 180000,
  hhTotal: 120000,
  cobranzaTotal: 320000,
  gastosTotal: 260000,
  
  // Para la gráfica principal
  monthlyData: [
    { name: 'Ene', ventas: 220000, cobrado: 280000, gastos: 240000 },
    { name: 'Feb', ventas: 230000, cobrado: 290000, gastos: 250000 },
    { name: 'Mar', ventas: 240000, cobrado: 300000, gastos: 270000 },
    { name: 'Abr', ventas: 250000, cobrado: 320000, gastos: 260000 },
  ],
  
  // Para las pestañas
  ventasRecords: [
    { id: '1', fecha: '2023-04-01', monto: 15000, detalles: 'Venta servicio mensual' },
    { id: '2', fecha: '2023-04-05', monto: 25000, detalles: 'Venta proyecto especial' },
  ],
  pxrRecords: [
    { id: '1', fecha: '2023-04-03', monto: 35000, detalles: 'Proyecto XR para Cliente A' },
    { id: '2', fecha: '2023-04-12', monto: 42000, detalles: 'Implementación XR Cliente B' },
  ],
  hhRecords: [
    { id: '1', fecha: '2023-04-02', monto: 22000, detalles: 'Proyecto HH Cliente X' },
    { id: '2', fecha: '2023-04-09', monto: 18000, detalles: 'Implementación HH Cliente Y' },
  ],
  cobranzaRecords: [
    { id: '1', fecha: '2023-04-05', monto: 45000, detalles: 'Pago Cliente A' },
    { id: '2', fecha: '2023-04-12', monto: 32000, detalles: 'Pago Cliente B' },
  ],
  gastosRecords: [
    { id: '1', fecha: '2023-04-04', monto: 12000, detalles: 'Gastos TDC1 - Oficina' },
    { id: '2', fecha: '2023-04-10', monto: 18000, detalles: 'Gastos TDC2 - Marketing' },
    { id: '3', fecha: '2023-04-15', monto: 9000, detalles: 'Gastos TDC3 - Viajes' },
    { id: '4', fecha: '2023-04-22', monto: 15000, detalles: 'Gastos TDC4 - Varios' },
  ],
};

const AdminPage = () => {
  const [user, setUser] = useState<{ role: string; email: string } | null>(null);
  
  useEffect(() => {
    // Obtener el usuario del localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Verificar si los gastos están excediendo lo cobrado
  const isOverspending = mockData.gastosTotal > mockData.cobranzaTotal;
  
  if (!user) {
    return <div>Cargando...</div>;
  }

  if (user.role !== 'admin' && !user.email.includes('sergio.t@topmarket.com.mx')) {
    return <div className="text-center p-8">No tienes permiso para acceder a esta página.</div>;
  }

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold mb-6">Panel Maestro</h2>
        
        <div className="grid gap-4 md:grid-cols-3">
          <DashboardCard
            title="Total Ventas"
            value={`$${mockData.ventasTotal.toLocaleString('es-MX')}`}
            trend={{ value: 4, isPositive: true }}
          />
          <DashboardCard
            title="Total Cobrado"
            value={`$${mockData.cobranzaTotal.toLocaleString('es-MX')}`}
            trend={{ value: 7, isPositive: true }}
          />
          <DashboardCard
            title="Total Gastos"
            value={`$${mockData.gastosTotal.toLocaleString('es-MX')}`}
            trend={{ value: 3, isPositive: false }}
            className={isOverspending ? "border-red-500" : ""}
          />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <DashboardCard
            title="Total PXR Cerrado"
            value={`$${mockData.pxrTotal.toLocaleString('es-MX')}`}
          />
          <DashboardCard
            title="Total HH Cerrado"
            value={`$${mockData.hhTotal.toLocaleString('es-MX')}`}
          />
        </div>
        
        <ChartContainer
          title="Resumen Financiero Mensual"
          description={isOverspending ? "⚠️ Alerta: Los gastos superan lo cobrado" : ""}
          data={mockData.monthlyData}
          series={[
            { name: 'Ventas', dataKey: 'ventas', color: '#0045FF' },
            { name: 'Cobrado', dataKey: 'cobrado', color: '#22C55E' },
            { name: 'Gastos', dataKey: 'gastos', color: '#EF4444' },
          ]}
          type="line"
        />
        
        <Tabs defaultValue="ventas" className="w-full">
          <TabsList className="grid grid-cols-5">
            <TabsTrigger value="ventas">Ventas</TabsTrigger>
            <TabsTrigger value="pxr">PXR</TabsTrigger>
            <TabsTrigger value="hh">HH</TabsTrigger>
            <TabsTrigger value="cobranza">Cobranza</TabsTrigger>
            <TabsTrigger value="gastos">Gastos TDC</TabsTrigger>
          </TabsList>
          
          <TabsContent value="ventas">
            <KpiTable 
              data={mockData.ventasRecords} 
              title="Historial de Ventas" 
              onExportCSV={() => console.log('Export CSV Ventas')}
            />
          </TabsContent>
          
          <TabsContent value="pxr">
            <KpiTable 
              data={mockData.pxrRecords} 
              title="Historial de PXR Cerrados" 
              onExportCSV={() => console.log('Export CSV PXR')}
            />
          </TabsContent>
          
          <TabsContent value="hh">
            <KpiTable 
              data={mockData.hhRecords} 
              title="Historial de HH Cerrados" 
              onExportCSV={() => console.log('Export CSV HH')}
            />
          </TabsContent>
          
          <TabsContent value="cobranza">
            <KpiTable 
              data={mockData.cobranzaRecords} 
              title="Historial de Cobranza" 
              onExportCSV={() => console.log('Export CSV Cobranza')}
            />
          </TabsContent>
          
          <TabsContent value="gastos">
            <KpiTable 
              data={mockData.gastosRecords} 
              title="Historial de Gastos TDC" 
              onExportCSV={() => console.log('Export CSV Gastos')}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
};

export default AdminPage;
