import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Interface for cobranza data
interface CobranzaData {
  id: string;
  semana: string;
  semana_inicio: string;
  semana_fin: string;
  cobrado_total: number;
  pagos_no_confirmados: number;
}

export const CobranzaKpiSemanal = () => {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date(2025, 3, 28)); // 28 de abril de 2025
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<CobranzaData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    cobrado_total: 0,
    pagos_no_confirmados: 0
  });
  
  // Determinar si el usuario actual es Natali Zárate
  const [isNataliZarate, setIsNataliZarate] = useState(false);
  
  useEffect(() => {
    // Obtener el usuario del localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setIsNataliZarate(user?.email === 'nataly.zarate@example.com' || user?.role === 'nataly' || user?.role === 'cobranza');
    }
  }, []);
  
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
  
  // Formatear fechas para base de datos
  const formattedStartDate = format(startOfCurrentWeek, 'yyyy-MM-dd');
  const formattedEndDate = format(endOfCurrentWeek, 'yyyy-MM-dd');
  const weekKey = format(startOfCurrentWeek, 'yyyy-MM-dd');

  // Cargar datos de la semana seleccionada
  useEffect(() => {
    const fetchWeekData = async () => {
      setIsLoading(true);
      try {
        // Buscar datos para la semana actual
        const { data, error } = await supabase
          .from('cobranza')
          .select('*')
          .eq('semana', weekKey)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 es el código cuando no se encuentra un registro
          throw error;
        }

        if (data) {
          setWeeklyData(data);
          setFormData({
            cobrado_total: data.cobrado_total,
            pagos_no_confirmados: data.pagos_no_confirmados
          });
        } else {
          setWeeklyData(null);
          setFormData({
            cobrado_total: 0,
            pagos_no_confirmados: 0
          });
        }
      } catch (error) {
        console.error('Error fetching cobranza data:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos de cobranza",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeekData();
  }, [currentDate, toast]);

  // Manejar cambios en el formulario
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  // Guardar datos en Supabase
  const handleSaveData = async () => {
    try {
      // Verificar que haya una sesión activa
      const { data: sessionData } = await supabase.auth.getSession();
      console.log("Sesión al guardar datos de cobranza:", 
        sessionData?.session ? "Activa con token: " + sessionData.session.access_token.substring(0, 10) + "..." : "No hay sesión"
      );
      
      if (!sessionData?.session) {
        console.error("No hay sesión activa de Supabase, intentando refresh...");
        const { data: refreshData } = await supabase.auth.refreshSession();
        console.log("Resultado del refresh:", refreshData.session ? "Sesión refrescada" : "No se pudo refrescar");
        
        if (!refreshData.session) {
          throw new Error("No hay sesión activa de Supabase y no se pudo refrescar. Por favor, inicie sesión nuevamente.");
        }
      }
      
      // Obtener el usuario actual para registrar quién realiza los cambios
      const storedUser = localStorage.getItem('user');
      const currentUser = storedUser ? JSON.parse(storedUser) : null;
      console.log("Usuario actual realizando guardado de cobranza:", currentUser);
      
      if (weeklyData) {
        // Actualizar registro existente
        console.log("Actualizando registro de cobranza con ID:", weeklyData.id);
        
        const { error } = await supabase
          .from('cobranza')
          .update({
            cobrado_total: formData.cobrado_total,
            pagos_no_confirmados: formData.pagos_no_confirmados,
            updated_at: new Date().toISOString()
          })
          .eq('id', weeklyData.id);

        if (error) {
          console.error("Error al actualizar cobranza:", error);
          console.log("Detalles del error:", JSON.stringify(error));
          throw error;
        } else {
          console.log("Registro de cobranza actualizado exitosamente");
        }
      } else {
        // Crear nuevo registro
        console.log("Creando nuevo registro de cobranza");
        
        const newRecord = {
          semana: weekKey,
          semana_inicio: formattedStartDate,
          semana_fin: formattedEndDate,
          cobrado_total: formData.cobrado_total,
          pagos_no_confirmados: formData.pagos_no_confirmados
        };
        
        console.log("Datos a insertar:", newRecord);
        
        const { error } = await supabase
          .from('cobranza')
          .insert([newRecord]);

        if (error) {
          console.error("Error al crear registro de cobranza:", error);
          console.log("Detalles del error:", JSON.stringify(error));
          throw error;
        } else {
          console.log("Nuevo registro de cobranza creado exitosamente");
        }
      }

      // Actualizar estado local con los nuevos datos
      setWeeklyData({
        id: weeklyData?.id || 'new-id', // El ID real se obtendrá en la siguiente carga
        semana: weekKey,
        semana_inicio: formattedStartDate,
        semana_fin: formattedEndDate,
        cobrado_total: formData.cobrado_total,
        pagos_no_confirmados: formData.pagos_no_confirmados
      });
      
      setIsEditing(false);
      toast({
        title: "Éxito",
        description: "Datos de cobranza guardados correctamente",
      });
    } catch (error) {
      console.error('Error saving cobranza data:', error);
      
      // Mostrar mensaje de error más detallado
      let errorMessage = "No se pudieron guardar los datos de cobranza";
      
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      } else if (typeof error === 'object' && error !== null) {
        // Si es un error de Supabase probablemente
        const supabaseError = error as any;
        if (supabaseError.message) {
          errorMessage += `: ${supabaseError.message}`;
        }
        if (supabaseError.details) {
          errorMessage += ` (${supabaseError.details})`;
        }
        if (supabaseError.hint) {
          errorMessage += ` - Sugerencia: ${supabaseError.hint}`;
        }
        
        // Verificar si es un error de política RLS
        if (supabaseError.message && supabaseError.message.includes("row-level security policy")) {
          errorMessage = "No tienes permisos para guardar esta información. Por favor, contacta al administrador.";
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  // Obtener valores para mostrar en los KPI cards
  const cobradoTotal = weeklyData?.cobrado_total || formData.cobrado_total || 0;
  const pagosNoConfirmados = weeklyData?.pagos_no_confirmados || formData.pagos_no_confirmados || 0;
  
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
        {isLoading ? (
          <div className="flex justify-center p-4">Cargando datos...</div>
        ) : isNataliZarate && isEditing ? (
          <div className="grid grid-cols-1 gap-4">
            <div className="p-4 bg-secondary/20 border border-border rounded-md">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">COBRADO TOTAL (MXN)</h3>
              <input 
                type="number" 
                name="cobrado_total"
                value={formData.cobrado_total}
                onChange={handleFormChange}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div className="p-4 bg-secondary/20 border border-border rounded-md">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">PAGOS NO CONFIRMADOS (MXN)</h3>
              <input 
                type="number" 
                name="pagos_no_confirmados"
                value={formData.pagos_no_confirmados}
                onChange={handleFormChange}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div className="flex justify-end space-x-2 mt-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
              <Button onClick={handleSaveData}>Guardar</Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <KpiCard
              title="COBRADO TOTAL"
              value={cobradoTotal}
            />
            <KpiCard
              title="PAGOS NO CONFIRMADOS"
              value={pagosNoConfirmados}
            />
            {isNataliZarate && (
              <div className="md:col-span-2 flex justify-end mt-2">
                <Button onClick={() => setIsEditing(true)}>Editar Datos</Button>
              </div>
            )}
          </div>
        )}
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
