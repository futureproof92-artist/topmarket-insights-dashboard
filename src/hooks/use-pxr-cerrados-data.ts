
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { findCurrentWeek, initWeeks, generateWeeksForYear, WeekData } from '@/utils/dateUtils';

export interface PxrCerradosWeekData {
  id?: string;
  semana: string;
  semana_inicio: Date;
  semana_fin: Date;
  total_pxr_cerrados: number;
  mejores_cuentas: string;
  created_at?: string;
  updated_at?: string;
}

export const usePxrCerradosData = () => {
  const { toast } = useToast();
  const [weeksData, setWeeksData] = useState<PxrCerradosWeekData[]>([]);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [currentWeekData, setCurrentWeekData] = useState<PxrCerradosWeekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    total_pxr_cerrados: '',
    mejores_cuentas: ''
  });

  // Función para cargar todos los datos de PXR cerrados
  const fetchPxrCerradosData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Primero verificamos si necesitamos inicializar las semanas
      const initSuccess = await initWeeks(new Date().getFullYear());
      
      // Obtenemos las semanas base primero desde reclutamiento
      // Esto sirve como respaldo para asegurarnos de tener todas las semanas
      const { data: semanas, error: semanasError } = await supabase
        .from('reclutamiento')
        .select('id, semana, semana_inicio, semana_fin')
        .order('semana_inicio', { ascending: true });
        
      if (semanasError) {
      } else {
      }
      
      // Obtenemos los datos de PXR cerrados de Supabase
      const { data: existingData, error } = await supabase
        .from('pxr_cerrados')
        .select('id, semana, semana_inicio, semana_fin, total_pxr, mejores_cuentas, created_at, updated_at')
        .order('semana_inicio', { ascending: true });
      
      if (error) {
        setError(`Error cargando datos: ${error.message}`);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos de PXR cerrados",
          variant: "destructive"
        });
        return;
      }
      
      // Si no hay datos de PXR, inicializamos con las semanas base
      if (!existingData || existingData.length === 0) {
        let weeksToInitializePxrWith: WeekData[] | null = semanas ? semanas.map(s => ({ // Explicitly map to WeekData
          semana: s.semana,
          semana_inicio: new Date(s.semana_inicio),
          semana_fin: new Date(s.semana_fin)
        })) : null;

        if (!weeksToInitializePxrWith || weeksToInitializePxrWith.length === 0) {
          const currentYearWeeks = generateWeeksForYear(new Date().getFullYear());
          weeksToInitializePxrWith = currentYearWeeks.map(cw => ({
            semana: cw.semana,
            semana_inicio: cw.semana_inicio,
            semana_fin: cw.semana_fin,
          }));
        }

        if (weeksToInitializePxrWith && weeksToInitializePxrWith.length > 0) {
          const pxrDataToInsert = weeksToInitializePxrWith.map(week => ({
            semana: week.semana,
            semana_inicio: week.semana_inicio.toISOString(), // Ensure ISO string for DB
            semana_fin: week.semana_fin.toISOString(), // Ensure ISO string for DB
            total_pxr: 0,
            mejores_cuentas: ''
          }));

          const { data: insertedData, error: insertError } = await supabase
            .from('pxr_cerrados')
            .insert(pxrDataToInsert)
            .select();

          if (insertError) {
            toast({
              title: "Error",
              description: "No se pudieron inicializar los datos de PXR cerrados",
              variant: "destructive"
            });
          } else {
            // Recargar todos los datos después de la inicialización exitosa
            fetchPxrCerradosData(); // Esto causará un re-render y la lógica de abajo se ejecutará de nuevo
            return; // Salir para evitar procesamiento adicional en este ciclo
          }
        }
      }
      
      // Procesamos y establecemos los datos de las semanas
      if (existingData && existingData.length > 0) {
        const weeksList = existingData.map(week => ({
          ...week,
          semana_inicio: new Date(week.semana_inicio),
          semana_fin: new Date(week.semana_fin),
          total_pxr_cerrados: week.total_pxr || 0, // Mapear de 'total_pxr' a 'total_pxr_cerrados'
          mejores_cuentas: week.mejores_cuentas || ''
        }));
        
        setWeeksData(weeksList);
        
        const currentDate = new Date();
        const closestIndex = findCurrentWeek(weeksList, currentDate);

        if (closestIndex === -1 || weeksList.length === 0) {
          setCurrentWeekIndex(0);
          setCurrentWeekData(null);
          setFormData({ total_pxr_cerrados: '', mejores_cuentas: '' });
        } else {
          setCurrentWeekIndex(closestIndex);
          const selectedWeek = weeksList[closestIndex];
          setCurrentWeekData(selectedWeek);
          setFormData({
            total_pxr_cerrados: String(selectedWeek?.total_pxr_cerrados || 0),
            mejores_cuentas: selectedWeek?.mejores_cuentas || ''
          });
        }
      } else {
        setWeeksData([]);
        setCurrentWeekIndex(0);
        setCurrentWeekData(null);
        setFormData({ total_pxr_cerrados: '', mejores_cuentas: '' });
      }
    } catch (error) {
      setError(`Error inesperado: ${error instanceof Error ? error.message : 'Desconocido'}`);
      toast({
        title: "Error",
        description: "Ocurrió un error al cargar los datos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Navegar a una semana específica por índice
  const goToWeek = (index: number) => {
    if (index >= 0 && index < weeksData.length) {
      setCurrentWeekIndex(index);
      const selectedWeek = weeksData[index];
      setCurrentWeekData(selectedWeek);
      setFormData({
        total_pxr_cerrados: String(selectedWeek?.total_pxr_cerrados || 0),
        mejores_cuentas: selectedWeek?.mejores_cuentas || ''
      });
    }
  };
  
  // Navegar a la semana anterior
  const goToPreviousWeek = () => {
    goToWeek(currentWeekIndex - 1);
  };
  
  // Navegar a la siguiente semana
  const goToNextWeek = () => {
    goToWeek(currentWeekIndex + 1);
  };
  
  // Manejar cambios en el formulario
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Guardar datos de PXR cerrados
  const savePxrCerradosData = async () => {
    if (!currentWeekData?.id) {
      toast({
        title: "Error",
        description: "No hay una semana seleccionada para actualizar",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    // Validar entrada numérica
    const pxrValue = parseInt(formData.total_pxr_cerrados);

    if (isNaN(pxrValue) || pxrValue < 0) {
      toast({
        title: "Error",
        description: "El valor de PXR cerrados debe ser numérico y no negativo",
        variant: "destructive"
      });
      setIsSaving(false);
      return;
    }
    
    try {
      // Preparar el objeto de actualización - solo incluir los campos que queremos actualizar
      const updateData = {
        total_pxr: pxrValue,
        mejores_cuentas: formData.mejores_cuentas
      };
      
      // Actualizar datos usando update() con filtro eq() en lugar de upsert con id dentro del objeto
      const { data, error: updateError } = await supabase
        .from('pxr_cerrados')
        .update(updateData)
        .eq('id', currentWeekData.id)
        .select('id, total_pxr, mejores_cuentas');
      
      if (updateError) {
        let errorMessage = "No se pudieron guardar los datos";
        if (updateError.message.includes("permission denied")) {
          setError("Error de permisos: " + updateError.message);
          errorMessage = "Error de permisos. Solo Gaby Davila y el administrador pueden actualizar datos.";
        } else {
          setError(`Error: ${updateError.message}`);
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }
      
      // Actualizar datos locales
      if (data && data.length > 0) {
        // Actualizar datos locales
        const updatedWeeksData = weeksData.map(week => {
          if (week.id === currentWeekData.id) {
            return {
              ...week,
              total_pxr_cerrados: pxrValue,
              mejores_cuentas: formData.mejores_cuentas
            };
          }
          return week;
        });
        
        setWeeksData(updatedWeeksData);
        setCurrentWeekData({
          ...currentWeekData,
          total_pxr_cerrados: pxrValue,
          mejores_cuentas: formData.mejores_cuentas
        });
        
        setError(null);
        
        toast({
          title: "Datos guardados",
          description: "La información se ha actualizado correctamente"
        });

        // Actualizar datos desde el servidor para confirmación
        setTimeout(() => {
          fetchPxrCerradosData();
        }, 300);
      }
      
    } catch (error) {
      setError(`Error inesperado: ${error instanceof Error ? error.message : 'Desconocido'}`);
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar los datos",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Inicializar datos cuando el componente se monta
  useEffect(() => {
    fetchPxrCerradosData();
  }, [fetchPxrCerradosData]);

  return {
    weeksData,
    currentWeekIndex,
    currentWeekData,
    loading,
    isSaving,
    error,
    formData,
    goToPreviousWeek,
    goToNextWeek,
    handleFormChange,
    savePxrCerradosData,
    fetchPxrCerradosData
  };
};
