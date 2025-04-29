
import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { ChartContainer } from '@/components/dashboard/ChartContainer';
import { KpiTable } from '@/components/dashboard/KpiTable';
import { CobranzaKpiSemanal } from '@/components/cobranza/CobranzaKpiSemanal';

// Datos simulados
const mockData = {
  cobranzaRecords: [
    { id: '1', fecha: '2023-04-05', monto: 45000, detalles: 'Pago Cliente A' },
    { id: '2', fecha: '2023-04-12', monto: 32000, detalles: 'Pago Cliente B' },
    { id: '3', fecha: '2023-04-20', monto: 38000, detalles: 'Pago Cliente C' },
  ],
  chartData: [
    { name: 'Ene', cobranza: 105000 },
    { name: 'Feb', cobranza: 115000 },
    { name: 'Mar', cobranza: 95000 },
    { name: 'Abr', cobranza: 115000 },
  ]
};

const CobranzaPage = () => {
  const [user, setUser] = useState<{ role: string; email: string } | null>(null);
  
  useEffect(() => {
    // Obtener el usuario del localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const totalCobranza = mockData.cobranzaRecords.reduce((sum, record) => sum + record.monto, 0);

  if (!user) {
    return <div>Cargando...</div>;
  }

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        {/* Nuevo componente de KPIs semanales */}
        <CobranzaKpiSemanal />
        
        <DashboardCard
          title="Total Cobrado"
          value={`$${totalCobranza.toLocaleString('es-MX')}`}
          description="Monto total cobrado"
          trend={{ value: 5, isPositive: true }}
          className="w-full md:w-1/2"
        />
        
        <ChartContainer
          title="Resumen Mensual de Cobranza"
          data={mockData.chartData}
          series={[
            { name: 'Monto Cobrado', dataKey: 'cobranza', color: '#0045FF' },
          ]}
          type="line"
        />
        
        <KpiTable 
          data={mockData.cobranzaRecords} 
          title="Historial de Cobranza" 
          onExportCSV={() => console.log('Export CSV Cobranza')}
        />
      </div>
    </AppShell>
  );
};

export default CobranzaPage;
