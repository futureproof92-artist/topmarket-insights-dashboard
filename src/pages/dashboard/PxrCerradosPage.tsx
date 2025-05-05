
import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, subWeeks, addDays, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { ChartContainer } from '@/components/dashboard/ChartContainer';
import { KpiTable } from '@/components/dashboard/KpiTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DeleteDataButton } from '@/components/admin/DeleteDataButton';

// Interfaces para los datos
interface WeeklyPxrData {
  id?: string;
  weekId: string;
  weekStart: Date;
  weekEnd: Date;
  total: number;
  mejoresCuentas: string;
  records: PxrRecord[];
}

interface PxrRecord {
  id: string;
  fecha: string;
  monto: number;
  detalles: string;
}

// Fecha de referencia: 2 de mayo de 2025
const CURRENT_DATE = new Date(2025, 4, 2); // Mayo es 4 en JavaScript (0-indexed)

// Generamos datos históricos para 4 semanas
const generateHistoricalData = () => {
  const weeksData: WeeklyPxrData[] = [];
  
  for (let i = 0; i < 4; i++) {
    const weekStartDate = startOfWeek(subWeeks(CURRENT_DATE, i), { weekStartsOn: 1 });
    const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 });
    
    // Generar algunos registros para esta semana
    const weekRecords: PxrRecord[] = [];
    for (let day = 0; day < 2; day++) {
      const recordDate = addDays(weekStartDate, day * 2 + 1);
      weekRecords.push({
        id: `${i}-${day}`,
        fecha: format(recordDate, 'yyyy-MM-dd'),
        monto: Math.floor(Math.random() * 40000) + 20000,
        detalles: `Proyecto XR Cliente ${String.fromCharCode(65 + i + day)}`
      });
    }
    
    // Calcular el total de la semana
    const weekTotal = weekRecords.reduce((sum, record) => sum + record.monto, 0);
    
    weeksData.push({
      weekId: `semana-${format(weekStartDate, 'yyyy-MM-dd')}`,
      weekStart: weekStartDate,
      weekEnd: weekEndDate,
      total: weekTotal,
      mejoresCuentas: `Cliente ${String.fromCharCode(65 + i)}, Cliente ${String.fromCharCode(66 + i)}`,
      records: weekRecords
    });
  }
  
  return weeksData;
};

const PxrCerradosPage = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<{ role: string; email: string } | null>(null);
  const [weeksData, setWeeksData] = useState<WeeklyPxrData[]>([]);
  const [selectedWeekId, setSelectedWeekId] = useState<string>('');
  const [currentWeekData, setCurrentWeekData] = useState<WeeklyPxrData | null>(null);
  const [formData, setFormData] = useState({
    totalCerrado: '',
    mejoresCuentas: ''
  });
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  // Determinar si el usuario actual es Gaby Davila
  const isGabyDavila = user?.email?.toLowerCase().includes('davila') || user?.role === 'davila';
  const isAdmin = user?.role === 'admin';
  
  useEffect(() => {
    // Obtener el usuario del localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Cargar datos de PXR cerrados desde Supabase
  useEffect(() => {
    const fetchPxrData = async () => {
      try {
        setLoadingData(true);
        // Intentar obtener datos de Supabase
        const { data, error } = await supabase
          .from('pxr_cerrados')
          .select('*')
          .order('semana_inicio', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          // Transformar datos de Supabase al formato que espera la aplicación
          const transformedData = data.map(item => {
            const weekStartDate = new Date(item.semana_inicio);
            const weekEndDate = new Date(item.semana_fin);
            
            return {
              id: item.id,
              weekId: `semana-${format(weekStartDate, 'yyyy-MM-dd')}`,
              weekStart: weekStartDate,
              weekEnd: weekEndDate,
              total: item.total_pxr,
              mejoresCuentas: item.mejores_cuentas || '',
              records: [] // No tenemos registros detallados en este ejemplo
            };
          });
          
          setWeeksData(transformedData);
        } else {
          // Si no hay datos en Supabase, usar datos generados
          setWeeksData(generateHistoricalData());
        }
      } catch (error) {
        console.error('Error al cargar datos de PXR:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los datos',
          variant: 'destructive'
        });
        // Usar datos generados si hay un error
        setWeeksData(generateHistoricalData());
      } finally {
        setLoadingData(false);
      }
    };
    
    if (user) {
      fetchPxrData();
    }
  }, [user, toast]);
  
  useEffect(() => {
    // Establecer por defecto la semana actual como seleccionada
    if (weeksData.length > 0) {
      const currentWeekId = weeksData[0].weekId;
      setSelectedWeekId(currentWeekId);
      setCurrentWeekData(weeksData[0]);
    }
  }, [weeksData]);

  // Función para formatear el ID de la semana para mostrar en la UI
  const formatWeekLabel = (weekStart: Date, weekEnd: Date) => {
    return `${format(weekStart, "d", { locale: es })}-${format(weekEnd, "d 'de' MMMM", { locale: es })}`;
  };
  
  // Manejar cambio de semana seleccionada
  const handleWeekChange = (weekId: string) => {
    setSelectedWeekId(weekId);
    const selected = weeksData.find(week => week.weekId === weekId);
    if (selected) {
      setCurrentWeekData(selected);
      
      // Si es Gaby o tiene rol davila, actualizar el formulario con los datos de la semana
      if (isGabyDavila && selected) {
        setFormData({
          totalCerrado: selected.total.toString(),
          mejoresCuentas: selected.mejoresCuentas || ''
        });
      }
    }
  };
  
  // Manejar cambios en el formulario
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Guardar datos del formulario en Supabase
  const handleSaveData = async () => {
    if (!currentWeekData) return;
    
    // Validar entrada numérica para el total
    const totalValue = parseFloat(formData.totalCerrado);
    if (isNaN(totalValue)) {
      toast({
        title: "Error",
        description: "El valor del total debe ser numérico",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Convertir las fechas al formato correcto para Supabase
      const weekStart = format(currentWeekData.weekStart, 'yyyy-MM-dd');
      const weekEnd = format(currentWeekData.weekEnd, 'yyyy-MM-dd');
      const semanaLabel = `Semana del ${formatWeekLabel(currentWeekData.weekStart, currentWeekData.weekEnd)}`;
      
      // Verificar si ya existe un registro con este ID
      if (currentWeekData.id) {
        // Actualizar registro existente
        const { error } = await supabase
          .from('pxr_cerrados')
          .update({
            total_pxr: totalValue,
            mejores_cuentas: formData.mejoresCuentas,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentWeekData.id);
          
        if (error) throw error;
      } else {
        // Crear nuevo registro
        const { data, error } = await supabase
          .from('pxr_cerrados')
          .insert([
            {
              semana: semanaLabel,
              semana_inicio: weekStart,
              semana_fin: weekEnd,
              total_pxr: totalValue,
              mejores_cuentas: formData.mejoresCuentas
            }
          ])
          .select();
          
        if (error) throw error;
        
        // Actualizar el ID en el estado
        if (data && data.length > 0) {
          setCurrentWeekData({
            ...currentWeekData,
            id: data[0].id
          });
        }
      }
      
      // Actualizar los datos locales
      const updatedWeeksData = weeksData.map(week => {
        if (week.weekId === selectedWeekId) {
          return {
            ...week,
            total: totalValue,
            mejoresCuentas: formData.mejoresCuentas
          };
        }
        return week;
      });
      
      setWeeksData(updatedWeeksData);
      
      toast({
        title: "Datos guardados",
        description: "La información se ha actualizado correctamente"
      });
    } catch (error) {
      console.error('Error al guardar datos:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los datos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Función para actualizar datos después de eliminar un registro
  const handleDataRefresh = async () => {
    try {
      setLoadingData(true);
      const { data, error } = await supabase
        .from('pxr_cerrados')
        .select('*')
        .order('semana_inicio', { ascending: false });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const transformedData = data.map(item => {
          const weekStartDate = new Date(item.semana_inicio);
          const weekEndDate = new Date(item.semana_fin);
          
          return {
            id: item.id,
            weekId: `semana-${format(weekStartDate, 'yyyy-MM-dd')}`,
            weekStart: weekStartDate,
            weekEnd: weekEndDate,
            total: item.total_pxr,
            mejoresCuentas: item.mejores_cuentas || '',
            records: []
          };
        });
        
        setWeeksData(transformedData);
        // Si no hay semana seleccionada, seleccionar la primera
        if (transformedData.length > 0 && (!selectedWeekId || !transformedData.find(w => w.weekId === selectedWeekId))) {
          setSelectedWeekId(transformedData[0].weekId);
          setCurrentWeekData(transformedData[0]);
        }
      } else {
        setWeeksData([]);
        setCurrentWeekData(null);
      }
    } catch (error) {
      console.error('Error al recargar datos:', error);
      toast({
        title: "Error",
        description: "No se pudieron recargar los datos",
        variant: "destructive"
      });
    } finally {
      setLoadingData(false);
    }
  };
  
  // Preparar datos para la gráfica
  const chartData = weeksData.map(week => ({
    name: formatWeekLabel(week.weekStart, week.weekEnd),
    pxr: Math.round(week.total / 1000) // Convertir a miles de MXN
  })).reverse(); // Reversa para que las semanas más antiguas aparezcan primero

  // Calcular el total acumulado de PXR cerrados
  const totalPxr = currentWeekData ? currentWeekData.total : 0;
  
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

        {/* Vista específica para Gaby Davila */}
        {isGabyDavila && (
          <div className="bg-white p-6 rounded-lg border shadow-sm space-y-6">
            <h2 className="text-xl font-semibold">Registro de PXR Cerrados</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="totalCerrado" className="block text-sm font-medium mb-2">
                  Total cerrado (MXN)
                </Label>
                <Input
                  id="totalCerrado"
                  name="totalCerrado"
                  type="number"
                  placeholder="Ingresa el monto total en MXN"
                  value={formData.totalCerrado}
                  onChange={handleFormChange}
                  className="w-full md:w-[300px]"
                />
              </div>
              <div>
                <Label htmlFor="mejoresCuentas" className="block text-sm font-medium mb-2">
                  Mejores cuentas de la semana
                </Label>
                <Textarea
                  id="mejoresCuentas"
                  name="mejoresCuentas"
                  placeholder="Describe las mejores cuentas de esta semana"
                  value={formData.mejoresCuentas}
                  onChange={handleFormChange}
                  className="h-24 w-full md:w-[500px]"
                />
              </div>
              <Button 
                onClick={handleSaveData} 
                className="mt-4"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        )}
        
        {/* Tarjeta de KPI - visible para todos */}
        <DashboardCard
          title="Total PXR Cerrados"
          value={`$${totalPxr.toLocaleString('es-MX')}`}
          description="Monto total de proyectos XR cerrados en la semana"
          trend={{ value: 14, isPositive: true }}
          className="w-full md:w-1/2"
        />
        
        {/* Vista adicional para administradores */}
        {isAdmin && !isGabyDavila && (
          <>
            <ChartContainer
              title="Resumen Semanal de PXR Cerrados (Miles MXN)"
              data={chartData}
              series={[
                { name: 'Monto PXR', dataKey: 'pxr', color: '#0045FF' },
              ]}
              type="bar"
            />
            
            {currentWeekData && currentWeekData.mejoresCuentas && (
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="text-lg font-medium mb-4">Mejores cuentas de la semana</h3>
                <p className="text-gray-700">{currentWeekData.mejoresCuentas}</p>
              </div>
            )}
            
            {/* Tabla de semanas con opciones de administración */}
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h3 className="text-lg font-medium mb-4">Administrar Semanas PXR</h3>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Semana</th>
                    <th className="text-right py-2">Monto</th>
                    <th className="text-right py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {weeksData.map(week => (
                    <tr key={week.weekId} className="border-b">
                      <td className="py-2">Semana del {formatWeekLabel(week.weekStart, week.weekEnd)}</td>
                      <td className="text-right py-2">${week.total.toLocaleString('es-MX')}</td>
                      <td className="text-right py-2">
                        {week.id && (
                          <DeleteDataButton
                            tableName="pxr_cerrados"
                            recordId={week.id}
                            onSuccess={handleDataRefresh}
                            buttonText="Eliminar"
                            buttonVariant="outline"
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <KpiTable 
              data={currentWeekData?.records || []} 
              title="Historial de PXR Cerrados" 
              onExportCSV={() => console.log('Export CSV PXR')}
            />
          </>
        )}
      </div>
    </AppShell>
  );
};

export default PxrCerradosPage;
