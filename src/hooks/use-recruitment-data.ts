import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { findCurrentWeek, initWeeks2025 } from '@/utils/dateUtils';

export interface RecruitmentWeekData {
  id?: string;
  semana: string;
  semana_inicio: Date;
  semana_fin: Date;
  reclutamientos_confirmados: number;
  freelancers_confirmados: number;
  created_at?: string;
  updated_at?: string;
}

export const useRecruitmentData = () => {
  const { toast } = useToast();
  const [weeksData, setWeeksData] = useState<RecruitmentWeekData[]>([]);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [currentWeekData, setCurrentWeekData] = useState<RecruitmentWeekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    reclutamientos_confirmados: '',
    freelancers_confirmados: ''
  });

  // Function to fetch all recruitment data
  const fetchRecruitmentData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("[RECRUITMENT_HOOK] Loading recruitment data with RLS");
      
      // First check if we need to initialize weeks
      await initWeeks2025();
      
      // Get recruitment data from Supabase with RLS enabled
      // Las políticas RLS ahora manejan automáticamente el acceso
      const { data: existingData, error } = await supabase
        .from('reclutamiento')
        .select('id, semana, semana_inicio, semana_fin, reclutamientos_confirmados, freelancers_confirmados, created_at, updated_at')
        .order('semana_inicio', { ascending: true });
      
      if (error) {
        console.error('[RECRUITMENT_HOOK] Error fetching recruitment data:', error);
        
        // Mensaje más específico para errores de RLS
        if (error.message.includes('row-level security policy')) {
          setError('Sin permisos para acceder a los datos de reclutamiento');
          toast({
            title: "Sin permisos",
            description: "No tienes permisos para acceder a los datos de reclutamiento",
            variant: "destructive"
          });
        } else {
          setError(`Error cargando datos: ${error.message}`);
          toast({
            title: "Error",
            description: "No se pudieron cargar los datos de reclutamiento",
            variant: "destructive"
          });
        }
        return;
      }
      
      // Process and set the weeks data
      if (existingData && existingData.length > 0) {
        console.log("[RECRUITMENT_HOOK] Data found:", existingData.length);
        
        const weeksList = existingData.map(week => ({
          ...week,
          semana_inicio: new Date(week.semana_inicio),
          semana_fin: new Date(week.semana_fin)
        }));
        
        setWeeksData(weeksList);
        
        // Find the current week (based on today's date)
        const currentDate = new Date();
        const closestIndex = findCurrentWeek(weeksList, currentDate);
        
        setCurrentWeekIndex(closestIndex);
        
        const selectedWeek = weeksList[closestIndex];
        setCurrentWeekData(selectedWeek);
        
        setFormData({
          reclutamientos_confirmados: String(selectedWeek?.reclutamientos_confirmados || 0),
          freelancers_confirmados: String(selectedWeek?.freelancers_confirmados || 0)
        });
      } else {
        console.log("[RECRUITMENT_HOOK] No data found");
        setWeeksData([]);
      }
    } catch (error) {
      console.error('[RECRUITMENT_HOOK] Error in fetchRecruitmentData:', error);
      setError(`Error inesperado: ${error instanceof Error ? error.message : 'Desconocido'}`);
      toast({
        title: "Error",
        description: "Ocurrió un error al cargar los datos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Navigate to a specific week by index
  const goToWeek = (index: number) => {
    if (index >= 0 && index < weeksData.length) {
      setCurrentWeekIndex(index);
      const selectedWeek = weeksData[index];
      setCurrentWeekData(selectedWeek);
      setFormData({
        reclutamientos_confirmados: String(selectedWeek?.reclutamientos_confirmados || 0),
        freelancers_confirmados: String(selectedWeek?.freelancers_confirmados || 0)
      });
    }
  };
  
  // Navigate to previous week
  const goToPreviousWeek = () => {
    goToWeek(currentWeekIndex - 1);
  };
  
  // Navigate to next week
  const goToNextWeek = () => {
    goToWeek(currentWeekIndex + 1);
  };
  
  // Handle form input changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Save recruitment data with RLS compatibility
  const saveRecruitmentData = async () => {
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
    
    // Validate numeric input
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
      console.log("[RECRUITMENT_HOOK] Updating record with RLS:", currentWeekData.id);
      
      // Prepare the update object - RLS policies will handle access control
      const updateData = {
        reclutamientos_confirmados: reclutamientosValue,
        freelancers_confirmados: freelancersValue
      };
      
      // Update data using update() with eq() filter
      // Las políticas RLS ahora manejan automáticamente los permisos
      const { data, error: updateError } = await supabase
        .from('reclutamiento')
        .update(updateData)
        .eq('id', currentWeekData.id)
        .select('id, reclutamientos_confirmados, freelancers_confirmados');
      
      if (updateError) {
        console.error('[RECRUITMENT_HOOK] Error updating recruitment data:', updateError);
        
        let errorMessage = "No se pudieron guardar los datos";
        if (updateError.message.includes("row-level security policy")) {
          setError("Sin permisos para actualizar datos de reclutamiento");
          errorMessage = "Sin permisos. Solo Karla y el administrador pueden actualizar datos.";
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
      
      // Update local data
      if (data && data.length > 0) {
        // Update local data
        const updatedWeeksData = weeksData.map(week => {
          if (week.id === currentWeekData.id) {
            return {
              ...week,
              reclutamientos_confirmados: reclutamientosValue,
              freelancers_confirmados: freelancersValue
            };
          }
          return week;
        });
        
        setWeeksData(updatedWeeksData);
        setCurrentWeekData({
          ...currentWeekData,
          reclutamientos_confirmados: reclutamientosValue,
          freelancers_confirmados: freelancersValue
        });
        
        setError(null);
        
        toast({
          title: "Datos guardados",
          description: "La información se ha actualizado correctamente"
        });

        // Refresh data from server for confirmation
        setTimeout(() => {
          fetchRecruitmentData();
        }, 300);
      }
      
    } catch (error) {
      console.error('[RECRUITMENT_HOOK] Error in saveRecruitmentData:', error);
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

  // Initialize data when component mounts
  useEffect(() => {
    fetchRecruitmentData();
  }, []);

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
    saveRecruitmentData,
    fetchRecruitmentData
  };
};
