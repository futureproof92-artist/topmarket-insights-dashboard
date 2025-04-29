
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Datos simulados para los KPIs
const mockWeeklyData = {
  '2025-04-28': {
    cobradoTotal: 125000,
    pagosNoConfirmados: 35000,
  },
  '2025-04-21': {
    cobradoTotal: 118000,
    pagosNoConfirmados: 28000,
  },
  '2025-04-14': {
    cobradoTotal: 132000,
    pagosNoConfirmados: 42000,
  },
  '2025-04-07': {
    cobradoTotal: 105000,
    pagosNoConfirmados: 25000,
  },
};

export const CobranzaKpiSemanal = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 3, 28)); // 28 de abril de 2025
  
  // Calcular fechas de inicio y fin de la semana
  const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 }); // Lunes
  const endOfCurrentWeek = endOfWeek(currentDate, { weekStartsOn: 1 }); // Domingo
  
  // Formatear rango de fechas para mostrar
  const weekRangeText = `Lun ${format(startOfCurrentWeek, 'd')} de ${format(startOfCurrentWeek, 'MMM', { locale: es })} ${format(startOfCurrentWeek, 'yyyy')} - Vie ${format(endOfCurrentWeek.getDate() < startOfCurrentWeek.getDate() ? endOfCurrentWeek : new Date(endOfCurrentWeek.setDate(endOfCurrentWeek.getDate() - 2)), 'd')} de ${format(endOfCurrentWeek, 'MMM', { locale: es })} ${format(endOfCurrentWeek, 'yyyy')}`;
  
  // Navegar a la semana anterior
  const goToPreviousWeek = () => {
    setCurrentDate(prevDate => subWeeks(prevDate, 1));
  };
  
  // Navegar a la semana siguiente
  const goToNextWeek = () => {
    setCurrentDate(prevDate => addWeeks(prevDate, 1));
  };
  
  // Obtener datos para la semana actual
  const weekKey = format(startOfCurrentWeek, 'yyyy-MM-dd');
  const currentWeekData = mockWeeklyData[weekKey as keyof typeof mockWeeklyData] || {
    cobradoTotal: 0,
    pagosNoConfirmados: 0,
  };
  
  // Calcular faltante confirmado
  const faltanteConfirmado = currentWeekData.cobradoTotal - currentWeekData.pagosNoConfirmados;
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">KPIs Semanales</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">{weekRangeText}</span>
            <Button variant="outline" size="sm" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard
            title="COBRADO TOTAL"
            value={currentWeekData.cobradoTotal}
          />
          <KpiCard
            title="PAGOS NO CONFIRMADOS"
            value={currentWeekData.pagosNoConfirmados}
          />
          <KpiCard
            title="FALTANTE CONFIRMADO"
            value={faltanteConfirmado}
            description="Cobrado total - Pagos no confirmados"
          />
        </div>
      </CardContent>
    </Card>
  );
};

// Componente para cada KPI individual
const KpiCard = ({ title, value, description }: { title: string, value: number, description?: string }) => {
  return (
    <div className="p-4 bg-secondary/20 border border-border rounded-md">
      <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
      <div className="text-2xl font-bold">${value.toLocaleString('es-MX')}</div>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  );
};
