
import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { ChartContainer } from '@/components/dashboard/ChartContainer';
import { KpiTable } from '@/components/dashboard/KpiTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Check, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { DateRangeSelector } from '@/components/ventas/DateRangeSelector';

// Tipos para los datos de HH cerrados
interface WeeklyHhData {
  id: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  cuentasCerradas: number;
  montoCerrado: number;
}

// Función para generar datos de semanas basados en la fecha actual
const generateWeeklyData = (): WeeklyHhData[] => {
  // Usamos el 2 de mayo de 2025 como fecha de referencia
  const currentDate = new Date(2025, 4, 2); // Mayo es 4 en JavaScript (0-indexed)
  
  // Generamos las últimas 4 semanas para mostrar más datos históricos
  const weeksData: WeeklyHhData[] = [];
  
  for (let i = 0; i < 4; i++) {
    const weekStartDate = startOfWeek(subDays(currentDate, i * 7), { weekStartsOn: 1 });
    const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 });
    
    // Calculamos el número de semana
    const weekNumber = Math.ceil(
      ((weekStartDate.getTime() - new Date(weekStartDate.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7
    );
    
    weeksData.push({
      id: String(i + 1),
      weekNumber: weekNumber,
      startDate: format(weekStartDate, 'dd/MM/yyyy'),
      endDate: format(weekEndDate, 'dd/MM/yyyy'),
      cuentasCerradas: Math.floor(Math.random() * 5) + 1, // Valor aleatorio entre 1 y 5
      montoCerrado: (Math.floor(Math.random() * 5) + 1) * 10000, // Valor aleatorio
    });
  }
  
  return weeksData.reverse(); // Ordenamos de la más reciente a la más antigua
};

// Datos para los charts
const generateChartData = (weeklyData: WeeklyHhData[]) => {
  return weeklyData.map((week) => ({
    name: `Sem ${week.weekNumber}`,
    cuentas: week.cuentasCerradas,
    monto: week.montoCerrado / 1000 // Dividimos por 1000 para visualización
  }));
};

const HhCerradosPage = () => {
  const [user, setUser] = useState<{ role: string; email: string } | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyHhData[]>([]);
  const [filteredData, setFilteredData] = useState<WeeklyHhData[]>([]);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    cuentasCerradas: number;
    montoCerrado: number;
  }>({
    cuentasCerradas: 0,
    montoCerrado: 0
  });
  
  // Añadimos estado para el selector de rango de fechas
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const currentDate = new Date(2025, 4, 2); // 2 de mayo de 2025
    // Por defecto, mostramos las últimas 2 semanas antes de la fecha actual
    const from = startOfWeek(subDays(currentDate, 14), { weekStartsOn: 1 });
    const to = endOfWeek(currentDate, { weekStartsOn: 1 });
    return { from, to };
  });
  
  useEffect(() => {
    // Obtener el usuario del localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    // Generar los datos de semanas basados en la fecha actual
    setWeeklyData(generateWeeklyData());
  }, []);
  
  useEffect(() => {
    // Filtrar datos basados en el rango de fechas seleccionado
    if (dateRange && dateRange.from && dateRange.to) {
      const filtered = weeklyData.filter(week => {
        const weekStart = parseISO(week.startDate.split('/').reverse().join('-'));
        const weekEnd = parseISO(week.endDate.split('/').reverse().join('-'));
        
        // Verificar si hay superposición entre el rango seleccionado y la semana
        return (
          isWithinInterval(dateRange.from, { start: weekStart, end: weekEnd }) ||
          isWithinInterval(dateRange.to, { start: weekStart, end: weekEnd }) ||
          isWithinInterval(weekStart, { start: dateRange.from, end: dateRange.to })
        );
      });
      
      setFilteredData(filtered);
    } else {
      setFilteredData(weeklyData);
    }
  }, [weeklyData, dateRange]);

  // Calculamos totales basados en los datos filtrados
  const totalCuentasCerradas = filteredData.reduce((sum, week) => sum + week.cuentasCerradas, 0);
  const totalMontoCerrado = filteredData.reduce((sum, week) => sum + week.montoCerrado, 0);
  const chartData = generateChartData(filteredData);

  const handleEdit = (row: WeeklyHhData) => {
    setEditingRowId(row.id);
    setEditValues({
      cuentasCerradas: row.cuentasCerradas,
      montoCerrado: row.montoCerrado
    });
  };

  const handleSave = (id: string) => {
    setWeeklyData(
      weeklyData.map((week) =>
        week.id === id
          ? { ...week, cuentasCerradas: editValues.cuentasCerradas, montoCerrado: editValues.montoCerrado }
          : week
      )
    );
    setEditingRowId(null);
    toast.success('Datos guardados correctamente');
  };

  const handleInputChange = (field: 'cuentasCerradas' | 'montoCerrado', value: string) => {
    const numValue = field === 'cuentasCerradas' 
      ? parseInt(value) || 0
      : parseFloat(value) || 0;
    
    setEditValues({
      ...editValues,
      [field]: numValue
    });
  };

  if (!user) {
    return <div>Cargando...</div>;
  }

  // Determinar si el usuario es Lilia o Admin para mostrar la vista adecuada
  const isLilia = user.role === 'lilia' || user.email?.includes('lilia');
  const isAdmin = user.role === 'admin' || user.email?.includes('admin');
  
  // Formatear la fecha actual para mostrar en la interfaz en el formato DD-MMM-YYYY
  const currentDate = new Date(2025, 4, 2);
  const formattedDate = format(currentDate, "dd'-'MMM'-'yyyy", { locale: es });

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        {/* Fecha actual y selector de rango */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-lg font-medium text-gray-800">
            {formattedDate}
          </div>
          
          {/* Agregamos el selector de rango de fechas */}
          <DateRangeSelector 
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </div>
        
        {/* KPI Cards para ambos tipos de usuarios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DashboardCard
            title="Total Cuentas HH Cerradas"
            value={totalCuentasCerradas.toString()}
            description="Número de cuentas de headhunting cerradas"
            trend={{ value: 5, isPositive: true }}
          />
          
          <DashboardCard
            title="Total Monto HH Cerrado"
            value={`$${totalMontoCerrado.toLocaleString('es-MX')}`}
            description="Monto total de proyectos HH cerrados"
            trend={{ value: 8, isPositive: true }}
          />
        </div>
        
        {/* Tabla de registro semanal para Lilia */}
        <Card>
          <CardHeader>
            <CardTitle>Registro Semanal de HH Cerrados</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Semana</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Cuentas Cerradas</TableHead>
                  <TableHead>Monto Cerrado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((week) => (
                  <TableRow key={week.id}>
                    <TableCell>Semana {week.weekNumber}</TableCell>
                    <TableCell>{week.startDate} - {week.endDate}</TableCell>
                    <TableCell>
                      {editingRowId === week.id ? (
                        <Input
                          type="number"
                          value={editValues.cuentasCerradas}
                          onChange={(e) => handleInputChange('cuentasCerradas', e.target.value)}
                          className="w-28"
                          min="0"
                        />
                      ) : (
                        week.cuentasCerradas
                      )}
                    </TableCell>
                    <TableCell>
                      {editingRowId === week.id ? (
                        <Input
                          type="number"
                          value={editValues.montoCerrado}
                          onChange={(e) => handleInputChange('montoCerrado', e.target.value)}
                          className="w-36"
                          min="0"
                        />
                      ) : (
                        `$${week.montoCerrado.toLocaleString('es-MX')}`
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingRowId === week.id ? (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleSave(week.id)}
                        >
                          <Check className="h-4 w-4 mr-1" /> Guardar
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleEdit(week)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {/* Gráficos para visualización (principalmente para admin) */}
        {(isAdmin || !isLilia) && (
          <>
            <ChartContainer
              title="Resumen Semanal de Cuentas HH Cerradas"
              data={chartData}
              series={[
                { name: 'Cuentas', dataKey: 'cuentas', color: '#0045FF' },
              ]}
              type="bar"
            />
            
            <ChartContainer
              title="Resumen Semanal de Montos HH Cerrados (Miles MXN)"
              data={chartData}
              series={[
                { name: 'Monto (Miles)', dataKey: 'monto', color: '#00C853' },
              ]}
              type="bar"
            />
          </>
        )}
      </div>
    </AppShell>
  );
};

export default HhCerradosPage;
