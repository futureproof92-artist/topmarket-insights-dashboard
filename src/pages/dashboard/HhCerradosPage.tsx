
import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { ChartContainer } from '@/components/dashboard/ChartContainer';
import { KpiTable } from '@/components/dashboard/KpiTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Check } from 'lucide-react';
import { toast } from 'sonner';

// Tipos para los datos de HH cerrados
interface WeeklyHhData {
  id: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  cuentasCerradas: number;
  montoCerrado: number;
}

// Datos simulados para las semanas
const mockWeeks: WeeklyHhData[] = [
  { 
    id: '1', 
    weekNumber: 18, 
    startDate: '2023-05-01', 
    endDate: '2023-05-07', 
    cuentasCerradas: 3,
    montoCerrado: 45000
  },
  { 
    id: '2', 
    weekNumber: 19, 
    startDate: '2023-05-08', 
    endDate: '2023-05-14', 
    cuentasCerradas: 2,
    montoCerrado: 32000
  },
  { 
    id: '3', 
    weekNumber: 20, 
    startDate: '2023-05-15', 
    endDate: '2023-05-21', 
    cuentasCerradas: 4,
    montoCerrado: 56000
  },
];

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
  const [weeklyData, setWeeklyData] = useState<WeeklyHhData[]>(mockWeeks);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    cuentasCerradas: number;
    montoCerrado: number;
  }>({
    cuentasCerradas: 0,
    montoCerrado: 0
  });
  
  useEffect(() => {
    // Obtener el usuario del localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const totalCuentasCerradas = weeklyData.reduce((sum, week) => sum + week.cuentasCerradas, 0);
  const totalMontoCerrado = weeklyData.reduce((sum, week) => sum + week.montoCerrado, 0);
  const chartData = generateChartData(weeklyData);

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

  return (
    <AppShell user={user}>
      <div className="space-y-6">
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
                {weeklyData.map((week) => (
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
              title="Resumen Mensual de Cuentas HH Cerradas"
              data={chartData}
              series={[
                { name: 'Cuentas', dataKey: 'cuentas', color: '#0045FF' },
              ]}
              type="bar"
            />
            
            <ChartContainer
              title="Resumen Mensual de Montos HH Cerrados (Miles MXN)"
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
