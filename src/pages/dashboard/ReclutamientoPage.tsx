
import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks, parseISO } from 'date-fns';
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
import { Calendar } from '@/components/ui/calendar';
import { format as formatDate } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";

// Interfaces para los datos
interface WeeklyRecruitmentData {
  id?: string;
  semana: string;
  semana_inicio: Date;
  semana_fin: Date;
  reclutamientos_confirmados: number;
  freelancers_confirmados: number;
  created_at?: string;
  updated_at?: string;
}

// Fecha de referencia: 2 de mayo de 2025
const CURRENT_DATE = new Date(2025, 4, 2); // Mayo es 4 en JavaScript (0-indexed)

// Función para formatear fechas de semana
const formatWeekLabel = (weekStart: Date, weekEnd: Date) => {
  return `${format(weekStart, "d", { locale: es })}-${format(weekEnd, "d 'de' MMMM", { locale: es })}`;
};

// Función para crear una semana nueva
const createWeekData = (dateOffset: number): WeeklyRecruitmentData => {
  const weekStartDate = startOfWeek(addWeeks(CURRENT_DATE, dateOffset), { weekStartsOn: 1 });
  const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 });
  
  return {
    semana: `semana-${format(weekStartDate, 'yyyy-MM-dd')}`,
    semana_inicio: weekStartDate,
    semana_fin: weekEndDate,
    reclutamientos_confirmados: 0,
    freelancers_confirmados: 0
  };
};

// Función para generar un conjunto de semanas
const generateWeeks = (numWeeks: number): WeeklyRecruitmentData[] => {
  const weeks: WeeklyRecruitmentData[] = [];
  
  // Generar semanas pasadas
  for (let i = numWeeks - 1; i >= 0; i--) {
    weeks.push(createWeekData(-i));
  }
  
  // Generar semanas futuras (próximas 4 semanas)
  for (let i = 1; i <= 4; i++) {
    weeks.push(createWeekData(i)); 
  }
  
  return weeks;
};

const ReclutamientoPage = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<{ role: string; email: string } | null>(null);
  const [weeksData, setWeeksData] = useState<WeeklyRecruitmentData[]>([]);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0); // Índice de la semana actual
  const [loading, setLoading] = useState(true);
  const [currentWeekData, setCurrentWeekData] = useState<WeeklyRecruitmentData | null>(null);
  const [formData, setFormData] = useState({
    reclutamientos_confirmados: '',
    freelancers_confirmados: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  
  // Determinar si el usuario actual es Karla Casillas
  const isKarlaCasillas = user?.email?.toLowerCase().includes('reclutamiento') || 
                        user?.email?.toLowerCase().includes('karla.casillas');
  const isAdmin = user?.role === 'admin';
  
  // Determinar si el usuario puede editar
  const canEdit = isKarlaCasillas || isAdmin;
  
  useEffect(() => {
    // Obtener el usuario del localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      console.log("[RECLUTAMIENTO_DEBUG] Usuario cargado:", parsedUser);
    }
  }, []);
  
  useEffect(() => {
    const fetchReclutamientoData = async () => {
      setLoading(true);
      try {
        console.log("[RECLUTAMIENTO_DEBUG] Cargando datos de reclutamiento");
        
        // Obtener datos de reclutamiento desde Supabase
        const { data: existingData, error } = await supabase
          .from('reclutamiento')
          .select('*')
          .order('semana_inicio', { ascending: true });
        
        if (error) {
          console.error('[RECLUTAMIENTO_DEBUG] Error fetching reclutamiento data:', error);
          toast({
            title: "Error",
            description: "No se pudieron cargar los datos de reclutamiento",
            variant: "destructive"
          });
          return;
        }
        
        let weeksList: WeeklyRecruitmentData[] = [];
        
        // Si hay datos, convertir las fechas a objetos Date
        if (existingData && existingData.length > 0) {
          console.log("[RECLUTAMIENTO_DEBUG] Datos encontrados:", existingData.length);
          weeksList = existingData.map(week => ({
            ...week,
            semana_inicio: new Date(week.semana_inicio),
            semana_fin: new Date(week.semana_fin)
          }));
        } else {
          console.log("[RECLUTAMIENTO_DEBUG] No se encontraron datos, creando semanas predeterminadas");
          // Si no hay datos, crear algunas semanas predeterminadas (últimas 12 semanas)
          weeksList = generateWeeks(12);
          
          // Intentar guardar las semanas predeterminadas en Supabase
          for (const week of weeksList) {
            try {
              const { data, error: insertError } = await supabase
                .from('reclutamiento')
                .insert({
                  semana: week.semana,
                  semana_inicio: week.semana_inicio.toISOString(),
                  semana_fin: week.semana_fin.toISOString(),
                  reclutamientos_confirmados: 0,
                  freelancers_confirmados: 0
                })
                .select('*');
              
              if (insertError) {
                console.error(`[RECLUTAMIENTO_DEBUG] Error inserting week ${week.semana}:`, insertError);
              } else if (data) {
                console.log(`[RECLUTAMIENTO_DEBUG] Successfully inserted week ${week.semana}`);
              }
            } catch (insertError) {
              console.error(`[RECLUTAMIENTO_DEBUG] Exception inserting week ${week.semana}:`, insertError);
            }
          }
          
          // Obtener los datos actualizados después de insertar
          const { data: updatedData } = await supabase
            .from('reclutamiento')
            .select('*')
            .order('semana_inicio', { ascending: true });
            
          if (updatedData) {
            weeksList = updatedData.map(week => ({
              ...week,
              semana_inicio: new Date(week.semana_inicio),
              semana_fin: new Date(week.semana_fin)
            }));
          }
        }
        
        setWeeksData(weeksList);
        
        // Establecer la semana actual como seleccionada por defecto
        if (weeksList.length > 0) {
          // Buscar el índice de la semana actual (la más cercana a la fecha actual)
          const currentDate = new Date();
          let closestIndex = 0;
          let smallestDiff = Infinity;
          
          weeksList.forEach((week, index) => {
            const diff = Math.abs(week.semana_inicio.getTime() - currentDate.getTime());
            if (diff < smallestDiff) {
              smallestDiff = diff;
              closestIndex = index;
            }
          });
          
          setCurrentWeekIndex(closestIndex);
          setCurrentWeekData(weeksList[closestIndex]);
          setFormData({
            reclutamientos_confirmados: String(weeksList[closestIndex].reclutamientos_confirmados || 0),
            freelancers_confirmados: String(weeksList[closestIndex].freelancers_confirmados || 0)
          });
        }
      } catch (error) {
        console.error('[RECLUTAMIENTO_DEBUG] Error in fetchReclutamientoData:', error);
        toast({
          title: "Error",
          description: "Ocurrió un error al cargar los datos",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchReclutamientoData();
    }
  }, [toast, user]);
  
  // Navegar a la semana anterior
  const goToPreviousWeek = () => {
    if (currentWeekIndex > 0) {
      const newIndex = currentWeekIndex - 1;
      setCurrentWeekIndex(newIndex);
      const selectedWeek = weeksData[newIndex];
      setCurrentWeekData(selectedWeek);
      setFormData({
        reclutamientos_confirmados: String(selectedWeek.reclutamientos_confirmados || 0),
        freelancers_confirmados: String(selectedWeek.freelancers_confirmados || 0)
      });
    }
  };
  
  // Navegar a la siguiente semana
  const goToNextWeek = () => {
    if (currentWeekIndex < weeksData.length - 1) {
      const newIndex = currentWeekIndex + 1;
      setCurrentWeekIndex(newIndex);
      const selectedWeek = weeksData[newIndex];
      setCurrentWeekData(selectedWeek);
      setFormData({
        reclutamientos_confirmados: String(selectedWeek.reclutamientos_confirmados || 0),
        freelancers_confirmados: String(selectedWeek.freelancers_confirmados || 0)
      });
    }
  };
  
  // Manejar cambios en el formulario
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Guardar datos del formulario
  const handleSaveData = async () => {
    if (!currentWeekData) return;
    
    setIsSaving(true);
    
    // Validar entrada numérica 
    const reclutamientosValue = parseInt(formData.reclutamientos_confirmados);
    const freelancersValue = parseInt(formData.freelancers_confirmados);

    if (isNaN(reclutamientosValue) || isNaN(freelancersValue) || reclutamientosValue < 0 || freelancersValue < 0) {
      toast({
        title: "Error",
        description: "Los valores deben ser numéricos y no negativos",
        variant: "destructive"
      });
      setIsSaving(false);
      return;
    }
    
    try {
      console.log("[RECLUTAMIENTO_DEBUG] Guardando datos:", {
        id: currentWeekData.id,
        semana: currentWeekData.semana,
        reclutamientos: reclutamientosValue,
        freelancers: freelancersValue
      });
      
      let result;
      
      // Si el registro ya tiene un ID, utilizamos update
      if (currentWeekData.id) {
        result = await supabase
          .from('reclutamiento')
          .update({
            reclutamientos_confirmados: reclutamientosValue,
            freelancers_confirmados: freelancersValue,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentWeekData.id)
          .select('*');
      } 
      // Si no tiene ID, pero tiene semana, actualizamos por semana
      else if (currentWeekData.semana) {
        result = await supabase
          .from('reclutamiento')
          .update({
            reclutamientos_confirmados: reclutamientosValue,
            freelancers_confirmados: freelancersValue,
            updated_at: new Date().toISOString()
          })
          .eq('semana', currentWeekData.semana)
          .select('*');
      }
      
      const { data, error } = result || { data: null, error: new Error("No se pudo actualizar") };
      
      if (error) {
        console.error('[RECLUTAMIENTO_DEBUG] Error updating reclutamiento data:', error);
        toast({
          title: "Error",
          description: "No se pudieron guardar los datos",
          variant: "destructive"
        });
        return;
      }
      
      console.log('[RECLUTAMIENTO_DEBUG] Datos actualizados:', data);
      
      // Actualizar los datos locales
      const updatedWeeksData = weeksData.map(week => {
        if (week === currentWeekData) {
          return {
            ...week,
            reclutamientos_confirmados: reclutamientosValue,
            freelancers_confirmados: freelancersValue
          };
        }
        return week;
      });
      
      setWeeksData(updatedWeeksData);
      
      if (data && data.length > 0) {
        const updatedItem = data[0];
        setCurrentWeekData({
          ...currentWeekData,
          id: updatedItem.id, // Asegurarnos de que tenemos el ID correcto
          reclutamientos_confirmados: updatedItem.reclutamientos_confirmados,
          freelancers_confirmados: updatedItem.freelancers_confirmados
        });
      } else {
        setCurrentWeekData({
          ...currentWeekData,
          reclutamientos_confirmados: reclutamientosValue,
          freelancers_confirmados: freelancersValue
        });
      }
      
      toast({
        title: "Datos guardados",
        description: "La información se ha actualizado correctamente"
      });
    } catch (error) {
      console.error('[RECLUTAMIENTO_DEBUG] Error in handleSaveData:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar los datos",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Preparar datos para la gráfica de reclutamientos
  const recruitmentChartData = weeksData
    .slice(0, 12) // Mostrar solo las últimas 12 semanas para el gráfico
    .map(week => ({
      name: formatWeekLabel(week.semana_inicio, week.semana_fin),
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
        {/* Navegador de semanas con flechas */}
        <div className="mb-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={goToPreviousWeek} 
              disabled={loading || currentWeekIndex <= 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="text-center">
              <h2 className="text-lg font-medium">
                Semana del{' '}
                {currentWeekData && (
                  <span>
                    {format(currentWeekData.semana_inicio, "'Lu' d 'de' MMM", { locale: es })} - {format(currentWeekData.semana_fin, "'Dom' d 'de' MMM yyyy", { locale: es })}
                  </span>
                )}
              </h2>
            </div>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={goToNextWeek} 
              disabled={loading || currentWeekIndex >= weeksData.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Formulario de edición - visible para Karla Casillas o administradores */}
        {canEdit && (
          <div className="bg-white p-6 rounded-lg border shadow-sm space-y-6">
            <h2 className="text-xl font-semibold">Registro de Reclutamientos</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reclutamientos_confirmados" className="block text-sm font-medium mb-2">
                  Reclutamientos confirmados esta semana
                </Label>
                <Input
                  id="reclutamientos_confirmados"
                  name="reclutamientos_confirmados"
                  type="number"
                  placeholder="Ingresa el número de reclutamientos"
                  value={formData.reclutamientos_confirmados}
                  onChange={handleFormChange}
                  className="w-full md:w-[300px]"
                  disabled={loading || isSaving}
                />
              </div>
              <div>
                <Label htmlFor="freelancers_confirmados" className="block text-sm font-medium mb-2">
                  Reclutamientos confirmados de freelancers esta semana
                </Label>
                <Input
                  id="freelancers_confirmados"
                  name="freelancers_confirmados"
                  type="number"
                  placeholder="Ingresa el número de freelancers"
                  value={formData.freelancers_confirmados}
                  onChange={handleFormChange}
                  className="w-full md:w-[300px]"
                  disabled={loading || isSaving}
                />
              </div>
              <Button 
                onClick={handleSaveData} 
                className="mt-4"
                disabled={loading || isSaving}
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        )}
        
        {/* Tarjetas de KPI - visible para todos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Reclutamientos confirmados esta semana</CardTitle>
              <CardDescription>Reclutamientos confirmados en la semana</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{currentWeekData?.reclutamientos_confirmados || 0}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Reclutamientos confirmados de freelancers esta semana</CardTitle>
              <CardDescription>Freelancers confirmados en la semana</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{currentWeekData?.freelancers_confirmados || 0}</p>
            </CardContent>
          </Card>
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
              data={weeksData.map(week => ({
                id: week.id || week.semana,
                fecha: formatWeekLabel(week.semana_inicio, week.semana_fin),
                monto: week.reclutamientos_confirmados,
                detalles: `Freelancers: ${week.freelancers_confirmados}`
              })) || []}
              title="Historial de Reclutamiento" 
              onExportCSV={() => console.log('Export CSV Reclutamiento')}
              loading={loading}
            />
          </>
        )}
      </div>
    </AppShell>
  );
};

export default ReclutamientoPage;
