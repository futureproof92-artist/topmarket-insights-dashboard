
import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { ChartContainer } from '@/components/dashboard/ChartContainer';
import { KpiTable } from '@/components/dashboard/KpiTable';

// Datos simulados
const mockData = {
  pxrRecords: [
    { id: '1', fecha: '2023-04-03', monto: 35000, detalles: 'Proyecto XR para Cliente A' },
    { id: '2', fecha: '2023-04-12', monto: 42000, detalles: 'Implementación XR Cliente B' },
    { id: '3', fecha: '2023-04-18', monto: 28000, detalles: 'Actualización sistema Cliente C' },
  ],
  chartData: [
    { name: 'Ene', pxr: 85000 },
    { name: 'Feb', pxr: 75000 },
    { name: 'Mar', pxr: 92000 },
    { name: 'Abr', pxr: 105000 },
  ]
};

const PxrCerradosPage = () => {
  const [user, setUser] = useState<{ role: string; email: string } | null>(null);
  
  useEffect(() => {
    // Obtener el usuario del localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const totalPxr = mockData.pxrRecords.reduce((sum, record) => sum + record.monto, 0);

  if (!user) {
    return <div>Cargando...</div>;
  }

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        <DashboardCard
          title="Total PXR Cerrados"
          value={`$${totalPxr.toLocaleString('es-MX')}`}
          description="Monto total de proyectos XR cerrados"
          trend={{ value: 14, isPositive: true }}
          className="w-full md:w-1/2"
        />
        
        <ChartContainer
          title="Resumen Mensual de PXR"
          data={mockData.chartData}
          series={[
            { name: 'Monto PXR', dataKey: 'pxr', color: '#0045FF' },
          ]}
          type="bar"
        />
        
        <KpiTable 
          data={mockData.pxrRecords} 
          title="Historial de PXR Cerrados" 
          onExportCSV={() => console.log('Export CSV PXR')}
        />
      </div>
    </AppShell>
  );
};

export default PxrCerradosPage;
