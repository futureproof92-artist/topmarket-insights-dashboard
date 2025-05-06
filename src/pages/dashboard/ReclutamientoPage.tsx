
import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, subWeeks, addDays, addWeeks } from 'date-fns';
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
import { supabase } from '@/integrations/supabase/client';
import { DateRangeSelector } from '@/components/ventas/DateRangeSelector';
import { DateRange } from 'react-day-picker';

// Interfaces para los datos
interface ReclutamientoData {
  id: string;
  semana: string;
  semana_inicio: string;
  semana_fin: string;
  reclutamientos_confirmados: number;
  freelancers_confirmados: number;
  created_at: string | null;
  updated_at: string | null;
}

interface WeekOption {
  id: string;
  label: string;
  startDate: Date;
  endDate: Date;
}

// Fecha de referencia: 2 de mayo de 2025
const CURRENT_DATE = new Date(2025, 4, 2); // Mayo es 4 en JavaScript (0-indexed)

const ReclutamientoPage = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<{ role: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [weekOptions, setWeekOptions] = useState<WeekOption[]>([]);
  const [selectedWeekId, setSelectedWeekId] = useState<string>('');
  const [currentWeekData, setCurrentWeekData] = useState<ReclutamientoData | null>(null);
  const [formData, setFormData] = useState({
    reclutamientosConfirmados: '',
    freelancersConfirmados: ''
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [reclutamientoHistorico, setReclutamientoHistorico] = useState<ReclutamientoData[]>([]);
  
  // Determinar si el usuario actual es Karla Casillas
  const isKarlaCasillas = user?.email === 'karla.casillas@example.com';
  const isAdmin = user?.role === 'admin';
  
  useEffect(() => {
    // Obtener el usuario del localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    // Generar opciones de semanas
    const weekOpts = generateWeekOptions();
    setWeekOptions(weekOpts);
    
    // Establecer la semana actual como seleccionada por defecto
    if (weekOpts.length > 0) {
      setSelectedWeekId(weekOpts[0].id);
      setDateRange({
        from: weekOpts[0].startDate,
        to: weekOpts[0].endDate
      });
    }
    
    // Cargar datos históricos
    loadReclutamientoData();
  }, []);

  // Generar opciones de semanas para el selector (4 semanas atrás hasta 2 semanas adelante)
  const generateWeekOptions = () => {
    const options: WeekOption[] = [];
    
    // Comienza 4 semanas atrás
    const startDate = subWeeks(CURRENT_DATE, 4);
    
    // Hasta 2 semanas adelante
    const endDate = addWeeks(CURRENT_DATE, 2);
    
    // Genera cada semana
    for (let i = 0; i <= 6; i++) {
      const weekStartDate = startOfWeek(addWeeks(startDate, i), { weekStartsOn: 1 });
      const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 });
      
      options.push({
        id: `semana-${format(weekStartDate, 'yyyy-MM-dd')}`,
        label: `Semana del ${format(weekStartDate, "d'-'d", { locale: es })} de ${format(weekStartDate, "MMMM", { locale: es })}`,
        startDate: weekStartDate,
        endDate: weekEndDate
      });
    }
    
    return options;
  };
  
  // Cargar datos de reclutamiento de Supabase
  const loadReclutamientoData = async () => {
    try {
      setIsLoading(true);
      
      // Obtener todos los registros de reclutamiento
      const { data, error } = await supabase
        .from('reclutamiento')
        .select('*')
        .order('semana_inicio', { ascending: false });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setReclutamientoHistorico(data);
        
        // Si hay una semana seleccionada, carga sus datos
        if (selectedWeekId) {
          const selectedSemana = data.find(item => item.semana === selectedWeekId.replace('semana-', ''));
          if (selectedSemana) {
            setCurrentWeekData(selectedSemana);
            setFormData({
              reclutamientosConfirmados: selectedSemana.reclutamientos_confirmados.toString(),
              freelancersConfirmados: selectedSemana.freelancers_confirmados.toString()
            });
          } else {
            setCurrentWeekData(null);
            resetFormData();
          }
        }
      } else {
        setReclutamientoHistorico([]);
        setCurrentWeekData(null);
        resetFormData();
      }
    } catch (error) {
      console.error('Error al cargar datos de reclutamiento:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos de reclutamiento',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Resetear datos del formulario
  const resetFormData = () => {
    setFormData({
      reclutamientosConfirmados: '',
      freelancersConfirmados: ''
    });
  };
  
  // Manejar cambio de semana seleccionada
  const handleWeekChange = (weekId: string) => {
    setSelectedWeekId(weekId);
    const selectedWeek = weekOptions.find(option => option.id === weekId);
    
    if (selectedWeek) {
      setDateRange({
        from: selectedWeek.startDate,
        to: selectedWeek.endDate
      });
      
      // Buscar si existen datos para esta semana
      const existingData = reclutamientoHistorico.find(
        item => item.semana === weekId.replace('semana-', '')
      );
      
      if (existingData) {
        setCurrentWeekData(existingData);
        setFormData({
          reclutamientosConfirmados: existingData.reclutamientos_confirmados.toString(),
          freelancersConfirmados: existingData.freelancers_confirmados.toString()
        });
      } else {
        setCurrentWeekData(null);
        resetFormData();
      }
    }
  };
  
  // Manejar cambios en el selector de rango de fechas
  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from) {
      setDateRange(range);
      
      // Buscar la semana que mejor coincide con el rango seleccionado
      const bestMatch = weekOptions.find(week => {
        if (!range.from || !range.to) return false;
        return (
          week.startDate.getTime() === startOfWeek(range.from, { weekStartsOn: 1 }).getTime() &&
          week.endDate.getTime() === endOfWeek(range.to, { weekStartsOn: 1 }).getTime()
        );
      });
      
      if (bestMatch) {
        setSelectedWeekId(bestMatch.id);
        handleWeekChange(bestMatch.id);
      }
    }
  };
  
  // Manejar cambios en el formulario
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Guardar datos del formulario
  const handleSaveData = async () => {
    if (!selectedWeekId) {
      toast({
        title: 'Error',
        description: 'Por favor selecciona una semana',
        variant: 'destructive'
      });
      return;
    }
    
    try {
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
      
      // Obtener la información de la semana seleccionada
      const selectedWeek = weekOptions.find(option => option.id === selectedWeekId);
      
      if (!selectedWeek) {
        toast({
          title: 'Error',
          description: 'Información de semana no disponible',
          variant: 'destructive'
        });
        return;
      }
      
      const semanaId = selectedWeekId.replace('semana-', '');
      const semanaInicio = format(selectedWeek.startDate, 'yyyy-MM-dd');
      const semanaFin = format(selectedWeek.endDate, 'yyyy-MM-dd');
      
      let result;
      
      // Si ya existe un registro para esta semana, actualizarlo
      if (currentWeekData) {
        result = await supabase
          .from('reclutamiento')
          .update({
            reclutamientos_confirmados: reclutamientosValue,
            freelancers_confirmados: freelancersValue,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentWeekData.id);
      } else {
        // Si no existe, crear un nuevo registro
        result = await supabase
          .from('reclutamiento')
          .insert({
            semana: semanaId,
            semana_inicio: semanaInicio,
            semana_fin: semanaFin,
            reclutamientos_confirmados: reclutamientosValue,
            freelancers_confirmados: freelancersValue
          });
      }
      
      if (result.error) {
        throw result.error;
      }
      
      toast({
        title: 'Datos guardados',
        description: 'La información se ha actualizado correctamente'
      });
      
      // Recargar los datos
      loadReclutamientoData();
      
    } catch (error) {
      console.error('Error al guardar datos:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los datos',
        variant: 'destructive'
      });
    }
  };
  
  // Preparar datos para la gráfica de reclutamientos
  const recruitmentChartData = reclutamientoHistorico
    .map(week => ({
      name: `Semana ${format(new Date(week.semana_inicio), "d MMM", { locale: es })}`,
      reclutamientos: week.reclutamientos_confirmados,
      freelancers: week.freelancers_confirmados
    }))
    .reverse(); // Reversa para que las semanas más antiguas aparezcan primero

  if (!user) {
    return <div>Cargando...</div>;
  }

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        {/* Título de la página */}
        <div>
          <h1 className="text-2xl font-bold mb-2">Reclutamiento Interno</h1>
          <p className="text-muted-foreground">
            Registro y seguimiento de reclutamientos confirmados
          </p>
        </div>
        
        {/* Selector de semana - visible para todos */}
        <div className="mb-6">
          <Label htmlFor="week-select" className="block text-sm font-medium mb-2">
            Seleccionar Semana
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={selectedWeekId} onValueChange={handleWeekChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar semana" />
              </SelectTrigger>
              <SelectContent>
                {weekOptions.map(week => (
                  <SelectItem key={week.id} value={week.id}>
                    {week.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <DateRangeSelector 
              dateRange={dateRange} 
              onDateRangeChange={handleDateRangeChange}
            />
          </div>
        </div>

        {/* Vista específica para Karla Casillas */}
        {isKarlaCasillas && (
          <div className="bg-white p-6 rounded-lg border shadow-sm space-y-6">
            <h2 className="text-xl font-semibold">Registro de Reclutamientos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Label htmlFor="reclutamientosConfirmados" className="block text-sm font-medium">
                  Reclutamientos confirmados esta semana
                </Label>
                <Input
                  id="reclutamientosConfirmados"
                  name="reclutamientosConfirmados"
                  type="number"
                  placeholder="Ingresa el número de reclutamientos"
                  value={formData.reclutamientosConfirmados}
                  onChange={handleFormChange}
                  className="w-full"
                />
              </div>
              <div className="space-y-4">
                <Label htmlFor="freelancersConfirmados" className="block text-sm font-medium">
                  Reclutamientos confirmados de freelancers esta semana
                </Label>
                <Input
                  id="freelancersConfirmados"
                  name="freelancersConfirmados"
                  type="number"
                  placeholder="Ingresa el número de freelancers"
                  value={formData.freelancersConfirmados}
                  onChange={handleFormChange}
                  className="w-full"
                />
              </div>
              <div className="md:col-span-2">
                <Button onClick={handleSaveData} className="mt-4">
                  Guardar
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Tarjetas de KPI - visible para todos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DashboardCard
            title="Reclutamientos confirmados esta semana"
            value={currentWeekData?.reclutamientos_confirmados || 0}
            description="Reclutamientos confirmados en la semana"
            trend={{ value: 8, isPositive: true }}
          />
          
          <DashboardCard
            title="Reclutamientos confirmados de freelancers esta semana"
            value={currentWeekData?.freelancers_confirmados || 0}
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
              data={currentWeekData?.id ? [{
                id: currentWeekData.id,
                fecha: `${format(new Date(currentWeekData.semana_inicio), "d MMM", { locale: es })} - ${format(new Date(currentWeekData.semana_fin), "d MMM", { locale: es })}`,
                monto: currentWeekData.reclutamientos_confirmados,
                detalles: `Freelancers: ${currentWeekData.freelancers_confirmados}`
              }] : []}
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
