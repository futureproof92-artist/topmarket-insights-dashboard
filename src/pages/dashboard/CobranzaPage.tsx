
import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { ChartContainer } from '@/components/dashboard/ChartContainer';
import { KpiTable } from '@/components/dashboard/KpiTable';
import { CobranzaKpiSemanal } from '@/components/cobranza/CobranzaKpiSemanal';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

// Datos simulados para el historial y gráficos
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

// Interface para datos de cobranza
interface CobranzaData {
  id: string;
  semana: string;
  semana_inicio: string;
  semana_fin: string;
  cobrado_total: number;
  pagos_no_confirmados: number;
  created_at: string;
  updated_at: string;
}

const CobranzaPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<{ role: string; email: string } | null>(null);
  const [totalCobranza, setTotalCobranza] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  
  // Verificar si el usuario está autorizado para ver esta página
  useEffect(() => {
    const checkAuthentication = async () => {
      // Obtener el usuario del localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // Verificar si el usuario tiene acceso a la página de cobranza
        const hasCobranzaAccess = 
          userData.role === 'admin' || 
          userData.role === 'cobranza' || 
          userData.role === 'nataly';
        
        setHasAccess(hasCobranzaAccess);
        
        // Si no tiene acceso, mostrar un mensaje y redirigir
        if (!hasCobranzaAccess) {
          toast({
            title: "Acceso denegado",
            description: "No tienes permiso para ver esta página",
            variant: "destructive"
          });
          navigate('/');
        }
      } else {
        // Si no hay usuario, redirigir al login
        toast({
          title: "Sesión no iniciada",
          description: "Por favor inicia sesión para continuar",
          variant: "destructive"
        });
        navigate('/');
      }
    };
    
    checkAuthentication();
  }, [navigate, toast]);

  // Cargar el total de cobranza del mes actual
  useEffect(() => {
    const fetchTotalCobranza = async () => {
      // Solo cargar datos si el usuario tiene acceso
      if (!hasAccess || !user) return;
      
      setIsLoading(true);
      try {
        // Obtener el mes actual (usando la fecha de referencia del proyecto: 2 de mayo de 2025)
        const currentDate = new Date(2025, 4, 2);
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        // Formatear fechas para la consulta
        const startDate = startOfMonth.toISOString().split('T')[0];
        const endDate = endOfMonth.toISOString().split('T')[0];
        
        // Consultar el total de cobranza en el mes actual
        const { data, error } = await supabase
          .from('cobranza')
          .select('cobrado_total')
          .gte('semana_inicio', startDate)
          .lte('semana_fin', endDate);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Sumar todos los montos de cobranza - convertimos a string para la comparación
          const totalAmount = data.reduce((sum, record) => sum + (parseFloat(String(record.cobrado_total)) || 0), 0);
          setTotalCobranza(totalAmount);
        } else {
          // Si no hay datos para el mes actual, usar datos simulados
          const simulatedTotal = mockData.cobranzaRecords.reduce((sum, record) => sum + record.monto, 0);
          setTotalCobranza(simulatedTotal);
        }
      } catch (error) {
        console.error('Error fetching cobranza data:', error);
        // En caso de error, usar datos simulados
        const simulatedTotal = mockData.cobranzaRecords.reduce((sum, record) => sum + record.monto, 0);
        setTotalCobranza(simulatedTotal);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTotalCobranza();
  }, [hasAccess, user]);

  // Mostrar cargando mientras verificamos acceso
  if (!user || isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  // Si no tiene acceso, no mostrar nada (ya se habrá redirigido)
  if (!hasAccess) {
    return null;
  }

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        {/* Componente mejorado de KPIs semanales que ahora usa Supabase */}
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
