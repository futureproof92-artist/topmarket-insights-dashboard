import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, subWeeks, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { ChartContainer } from '@/components/dashboard/ChartContainer';
import { KpiTable } from '@/components/dashboard/KpiTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

// Interfaces para los datos
interface WeeklyRecruitmentData {
  weekId: string;
  weekStart: Date;
  weekEnd: Date;
  totalRecruitments: number;
  totalFreelancers: number;
  records: RecruitmentRecord[];
}

interface RecruitmentRecord {
  id: string;
  fecha: string;
  reclutamientosConfirmados: number;
  freelancersConfirmados: number;
}

// Fecha de referencia: 2 de mayo de 2025
const CURRENT_DATE = new Date(2025, 4, 2); // Mayo es 4 en JavaScript (0-indexed)

// Generamos datos históricos para 4 semanas
const generateHistoricalData = () => {
  const weeksData: WeeklyRecruitmentData[] = [];
  
  for (let i = 0; i < 4; i++) {
    const weekStartDate = startOfWeek(subWeeks(CURRENT_DATE, i), { weekStartsOn: 1 });
    const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 });
    
    // Generar algunos registros para esta semana
    const weekRecords: RecruitmentRecord[] = [];
    for (let day = 0; day < 2; day++) {
      const recordDate = addDays(weekStartDate, day * 2 + 1);
      weekRecords.push({
        id: `${i}-${day}`,
        fecha: format(recordDate, 'yyyy-MM-dd'),
        reclutamientosConfirmados: Math.floor(Math.random() * 5) + 1,
        freelancersConfirmados: Math.floor(Math.random() * 3)
      });
    }
    
    // Calcular los totales de la semana
    const weekTotalRecruitments = weekRecords.reduce((sum, record) => sum + record.reclutamientosConfirmados, 0);
    const weekTotalFreelancers = weekRecords.reduce((sum, record) => sum + record.freelancersConfirmados, 0);
    
    weeksData.push({
      weekId: `semana-${format(weekStartDate, 'yyyy-MM-dd')}`,
      weekStart: weekStartDate,
      weekEnd: weekEndDate,
      totalRecruitments: weekTotalRecruitments,
      totalFreelancers: weekTotalFreelancers,
      records: weekRecords
    });
  }
  
  return weeksData;
};

const ReclutamientoPage = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<{ role: string; email: string } | null>(null);
  const [weeksData, setWeeksData] = useState<WeeklyRecruitmentData[]>(generateHistoricalData);
  const [selectedWeekId, setSelectedWeekId] = useState<string>('');
  const [currentWeekData, setCurrentWeekData] = useState<WeeklyRecruitmentData | null>(null);
  const [formData, setFormData] = useState({
    reclutamientosConfirmados: '',
    freelancersConfirmados: ''
  });
  
  // Determinar si el usuario actual es Karla Casillas
  const isKarlaCasillas = user?.email === 'karla.casillas@example.com';
  const isAdmin = user?.role === 'admin';
  
  useEffect(() => {
    // Obtener el usuario del localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);
  
  useEffect(() => {
    // Establecer por defecto la semana actual como seleccionada
    if (weeksData.length > 0) {
      const currentWeekId = weeksData[0].weekId;
      setSelectedWeekId(currentWeekId);
      setCurrentWeekData(weeksData[0]);
    }
  }, [weeksData]);

  // Funci��n para formatear el ID de la semana para mostrar en la UI
  const formatWeekLabel = (weekStart: Date, weekEnd: Date) => {
    return `${format(weekStart, "d", { locale: es })}-${format(weekEnd, "d 'de' MMMM", { locale: es })}`;
  };
  
  // Manejar cambio de semana seleccionada
  const handleWeekChange = (weekId: string) => {
    setSelectedWeekId(weekId);
    const selected = weeksData.find(week => week.weekId === weekId);
    if (selected) {
      setCurrentWeekData(selected);
      
      // Si es Karla, actualizar el formulario con los datos de la semana
      if (isKarlaCasillas && selected) {
        setFormData({
          reclutamientosConfirmados: selected.totalRecruitments.toString(),
          freelancersConfirmados: selected.totalFreelancers.toString()
        });
      }
    }
  };
  
  // Manejar cambios en el formulario
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Guardar datos del formulario
  const handleSaveData = () => {
    if (!currentWeekData) return;
    
    // Validar entrada numérica 
    const reclutamientosValue = parseInt(formData.reclutamientosConfirmados);
    const freelancersValue = parseInt(formData.freelancersConfirmados);

    if (isNaN(reclutamientosValue) || isNaN(freelancersValue) || reclutamientosValue < 0 || freelancersValue < 0) {
      toast({
        title: "Error",
        description: "Los valores deben ser numéricos y no negativos",
        variant: "destructive"
      });
      return;
    }
    
    // Actualizar la semana con los datos ingresados
    const updatedWeeksData = weeksData.map(week => {
      if (week.weekId === selectedWeekId) {
        return {
          ...week,
          totalRecruitments: reclutamientosValue,
          totalFreelancers: freelancersValue
        };
      }
      return week;
    });
    
    setWeeksData(updatedWeeksData);
    setCurrentWeekData({
      ...currentWeekData,
      totalRecruitments: reclutamientosValue,
      totalFreelancers: freelancersValue
    });
    
    toast({
      title: "Datos guardados",
      description: "La información se ha actualizado correctamente"
    });
  };
  
  // Preparar datos para la gráfica de reclutamientos
  const recruitmentChartData = weeksData.map(week => ({
    name: formatWeekLabel(week.weekStart, week.weekEnd),
    reclutamientos: week.totalRecruitments,
    freelancers: week.totalFreelancers
  })).reverse(); // Reversa para que las semanas más antiguas aparezcan primero

  if (!user) {
    return <div>Cargando...</div>;
  }

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        {/* Selector de semana - visible para todos */}
        <div className="mb-6">
          <Label htmlFor="week-select" className="block text-sm font-medium mb-2">
            Seleccionar Semana
          </Label>
          <Select value={selectedWeekId} onValueChange={handleWeekChange}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Seleccionar semana" />
            </SelectTrigger>
            <SelectContent>
              {weeksData.map(week => (
                <SelectItem key={week.weekId} value={week.weekId}>
                  Semana del {formatWeekLabel(week.weekStart, week.weekEnd)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Vista específica para Karla Casillas */}
        {isKarlaCasillas && (
          <div className="bg-white p-6 rounded-lg border shadow-sm space-y-6">
            <h2 className="text-xl font-semibold">Registro de Reclutamientos</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reclutamientosConfirmados" className="block text-sm font-medium mb-2">
                  Reclutamientos confirmados esta semana
                </Label>
                <Input
                  id="reclutamientosConfirmados"
                  name="reclutamientosConfirmados"
                  type="number"
                  placeholder="Ingresa el número de reclutamientos"
                  value={formData.reclutamientosConfirmados}
                  onChange={handleFormChange}
                  className="w-full md:w-[300px]"
                />
              </div>
              <div>
                <Label htmlFor="freelancersConfirmados" className="block text-sm font-medium mb-2">
                  Reclutamientos confirmados de freelancers esta semana
                </Label>
                <Input
                  id="freelancersConfirmados"
                  name="freelancersConfirmados"
                  type="number"
                  placeholder="Ingresa el número de freelancers"
                  value={formData.freelancersConfirmados}
                  onChange={handleFormChange}
                  className="w-full md:w-[300px]"
                />
              </div>
              <Button onClick={handleSaveData} className="mt-4">
                Guardar
              </Button>
            </div>
          </div>
        )}
        
        {/* Tarjetas de KPI - visible para todos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DashboardCard
            title="Reclutamientos confirmados esta semana"
            value={currentWeekData?.totalRecruitments || 0}
            description="Reclutamientos confirmados en la semana"
            trend={{ value: 8, isPositive: true }}
          />
          
          <DashboardCard
            title="Reclutamientos confirmados de freelancers esta semana"
            value={currentWeekData?.totalFreelancers || 0}
            description="Freelancers confirmados en la semana"
            trend={{ value: 5, isPositive: true }}
          />
        </div>
        
        {/* Vista adicional para administradores */}
        {isAdmin && !isKarlaCasillas && (
          <>
            <ChartContainer
              title="Resumen Semanal de Reclutamiento"
              data={recruitmentChartData}
              series={[
                { name: 'Reclutamientos', dataKey: 'reclutamientos', color: '#0045FF' },
                { name: 'Freelancers', dataKey: 'freelancers', color: '#00C2A8' },
              ]}
              type="bar"
            />
            
            <KpiTable 
              data={currentWeekData?.records.map(record => ({
                id: record.id,
                fecha: record.fecha,
                monto: record.reclutamientosConfirmados,
                detalles: `Freelancers: ${record.freelancersConfirmados}`
              })) || []}
              title="Historial de Reclutamiento" 
              onExportCSV={() => console.log('Export CSV Reclutamiento')}
            />
          </>
        )}
      </div>
    </AppShell>
  );
};

export default ReclutamientoPage;
