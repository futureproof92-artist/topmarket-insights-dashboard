
import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { ChartContainer } from '@/components/dashboard/ChartContainer';
import { KpiTable } from '@/components/dashboard/KpiTable';

// Datos simulados
const mockData = {
  hhRecords: [
    { id: '1', fecha: '2023-04-02', monto: 22000, detalles: 'Proyecto HH Cliente X' },
    { id: '2', fecha: '2023-04-09', monto: 18000, detalles: 'Implementación HH Cliente Y' },
    { id: '3', fecha: '2023-04-15', monto: 24000, detalles: 'Mantenimiento HH Cliente Z' },
  ],
  chartData: [
    { name: 'Ene', hh: 60000 },
    { name: 'Feb', hh: 68000 },
    { name: 'Mar', hh: 55000 },
    { name: 'Abr', hh: 64000 },
  ]
};

const HhCerradosPage = () => {
  const [user, setUser] = useState<{ role: string; email: string } | null>(null);
  
  useEffect(() => {
    // Obtener el usuario del localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const totalHh = mockData.hhRecords.reduce((sum, record) => sum + record.monto, 0);

  if (!user) {
    return <div>Cargando...</div>;
  }

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        <DashboardCard
          title="Total HH Cerrados"
          value={`$${totalHh.toLocaleString('es-MX')}`}
          description="Monto total de proyectos HH cerrados"
          trend={{ value: 8, isPositive: true }}
          className="w-full md:w-1/2"
        />
        
        <ChartContainer
          title="Resumen Mensual de HH"
          data={mockData.chartData}
          series={[
            { name: 'Monto HH', dataKey: 'hh', color: '#0045FF' },
          ]}
          type="bar"
        />
        
        <KpiTable 
          data={mockData.hhRecords} 
          title="Historial de HH Cerrados" 
          onExportCSV={() => console.log('Export CSV HH')}
        />
      </div>
    </AppShell>
  );
};

export default HhCerradosPage;
