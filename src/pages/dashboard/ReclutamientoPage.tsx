import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AppShell } from '@/components/layout/AppShell';
import { ChartContainer } from '@/components/dashboard/ChartContainer';
import { KpiTable } from '@/components/dashboard/KpiTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DateRangeWeekSelector } from '@/components/dashboard/DateRangeWeekSelector';
import { GenerateWeeksButton } from '@/components/dashboard/GenerateWeeksButton';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Shield, Info } from "lucide-react";
import { useAuth } from '@/hooks/use-auth';

// Interfaces for the data
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

// Reference date: May 7, 2025 (Mexico City Time)
const CURRENT_DATE = new Date(2025, 4, 7); // May is 4 in JavaScript (0-indexed)

// Format week label function
const formatWeekLabel = (weekStart: Date, weekEnd: Date) => {
  try {
    return `Lun ${format(weekStart, "d 'de' MMM", { locale: es })} a Dom ${format(weekEnd, "d 'de' MMM", { locale: es })}`;
  } catch (error) {
    console.error("[RECLUTAMIENTO_DEBUG] Error formatting week label:", error);
    return "Error de formato";
  }
};

const ReclutamientoPage = () => {
  const { toast } = useToast();
  const { user, isKarla, isAdmin } = useAuth(); // Usamos el hook mejorado
  const [weeksData, setWeeksData] = useState<WeeklyRecruitmentData[]>([]);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentWeekData, setCurrentWeekData] = useState<WeeklyRecruitmentData | null>(null);
  const [formData, setFormData] = useState({
    reclutamientos_confirmados: '',
    freelancers_confirmados: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Determine if the user can edit - simplificado, usando el hook useAuth
  const canEdit = isKarla || isAdmin;
  
  // Función de guardar mejorada que NO verifica permisos en cliente
  const handleSaveData = async () => {
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
      console.log("[RECLUTAMIENTO_DEBUG] Actualizando record:", currentWeekData.id);
      
      // Prepare the update object - only include the necessary fields
      const updateData = {
        reclutamientos_confirmados: reclutamientosValue,
        freelancers_confirmados: freelancersValue
      };
      
      // IMPORTANTE: Actualizamos con returning: 'minimal' para evitar el SELECT automático
      // Las RLS policies en Supabase se encargarán de la autorización
      const { data, error: updateError } = await supabase
        .from('reclutamiento')
        .update(updateData)
        .eq('id', currentWeekData.id)
        .select('id, reclutamientos_confirmados, freelancers_confirmados')
        .returns('minimal');
      
      if (updateError) {
        console.error('[RECLUTAMIENTO_DEBUG] Error updating recruitment data:', updateError);
        
        let errorMessage = "No se pudieron guardar los datos";
        if (updateError.message.includes("permission denied")) {
          setError("Error de permisos: " + updateError.message);
          errorMessage = "Error de permisos de base de datos. Por favor, contacta al administrador.";
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

        // Refrescar los datos desde el servidor para confirmación
        // Utilizamos un timeout para evitar ejecución inmediata tras la actualización
        setTimeout(() => {
          fetchReclutamientoData();
        }, 300);
      }
      
    } catch (error) {
      console.error('[RECLUTAMIENTO_DEBUG] Error in handleSaveData:', error);
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
  
  // Refetch data function mejorada - CORRIGIENDO EL USO DE SELECT
  const fetchReclutamientoData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("[RECLUTAMIENTO_DEBUG] Loading recruitment data");
      
      // Get recruitment data from Supabase - OPTIMIZANDO CAMPOS SELECCIONADOS
      const { data: existingData, error } = await supabase
        .from('reclutamiento')
        .select('id, semana, semana_inicio, semana_fin, reclutamientos_confirmados, freelancers_confirmados, created_at, updated_at')
        .order('semana_inicio', { ascending: true });
      
      if (error) {
        console.error('[RECLUTAMIENTO_DEBUG] Error fetching recruitment data:', error);
        setError(`Error cargando datos: ${error.message}`);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos de reclutamiento",
          variant: "destructive"
        });
        return;
      }
      
      // Process and set the weeks data
      if (existingData && existingData.length > 0) {
        console.log("[RECLUTAMIENTO_DEBUG] Data found:", existingData.length);
        
        const weeksList = existingData.map(week => ({
          ...week,
          semana_inicio: new Date(week.semana_inicio),
          semana_fin: new Date(week.semana_fin)
        }));
        
        setWeeksData(weeksList);
        
        // Find the current week (closest to today)
        const currentDate = CURRENT_DATE;
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
        
        const selectedWeek = weeksList[closestIndex];
        setCurrentWeekData(selectedWeek);
        
        setFormData({
          reclutamientos_confirmados: String(selectedWeek?.reclutamientos_confirmados || 0),
          freelancers_confirmados: String(selectedWeek?.freelancers_confirmados || 0)
        });
      } else {
        console.log("[RECLUTAMIENTO_DEBUG] No data found");
        setWeeksData([]);
      }
    } catch (error) {
      console.error('[RECLUTAMIENTO_DEBUG] Error in fetchReclutamientoData:', error);
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
  
  // Fetch data when component mounts
  useEffect(() => {
    fetchReclutamientoData();
  }, [toast]);
  
  // Navigate to previous week
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
  
  // Navigate to next week
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
  
  // Handle form changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Prepare chart data
  const recruitmentChartData = weeksData
    .slice(Math.max(0, weeksData.length - 12))
    .map(week => ({
      name: formatWeekLabel(week.semana_inicio, week.semana_fin),
      reclutamientos: week.reclutamientos_confirmados,
      freelancers: week.freelancers_confirmados
    }))
    .reverse();

  // UI para cuando no hay usuario
  if (!user) {
    return <div>Cargando...</div>;
  }

  // Create an adapted user object matching the expected AppShell structure
  const appShellUser = {
    email: user.email || '',
    role: isAdmin ? 'admin' : (isKarla ? 'karla' : 'user')  // Determine role based on access flags
  };

  const currentWeekLabel = currentWeekData 
    ? formatWeekLabel(currentWeekData.semana_inicio, currentWeekData.semana_fin)
    : "No hay semana seleccionada";

  // Verificar si estamos en la última semana
  const isLastWeek = currentWeekIndex === weeksData.length - 1;

  return (
    <AppShell user={appShellUser}>
      <div className="space-y-6">
        {/* Week Navigator */}
        <div className="mb-6">
          <DateRangeWeekSelector
            currentIndex={currentWeekIndex}
            totalWeeks={weeksData.length}
            currentWeekLabel={currentWeekLabel}
            onPrevious={goToPreviousWeek}
            onNext={goToNextWeek}
            loading={loading}
          />
          
          {/* Admin controls for generating future weeks */}
          {isAdmin && isLastWeek && (
            <div className="mt-4">
              <GenerateWeeksButton onSuccess={fetchReclutamientoData} />
            </div>
          )}
          
          {/* Last week indicator */}
          {isLastWeek && (
            <div className="mt-2 flex items-center text-sm text-amber-600 bg-amber-50 p-2 rounded-md border border-amber-200">
              <Info className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>Has llegado a la última semana disponible. {isAdmin ? "" : "Si necesitas más semanas futuras, contacta al administrador."}</span>
            </div>
          )}
        </div>

        {/* Error message display */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <Shield className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Edit Form - visible for Karla Casillas o admins */}
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
                  disabled={loading || isSaving || !currentWeekData}
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
                  disabled={loading || isSaving || !currentWeekData}
                />
              </div>
              <Button 
                onClick={handleSaveData} 
                className="mt-4"
                disabled={loading || isSaving || !currentWeekData}
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </Button>
              
              {/* Debug info - solo para desarrollo */}
              {isAdmin && (
                <div className="mt-4 p-3 bg-slate-100 rounded-md text-xs text-slate-600">
                  <p>Debug info (sólo admin):</p>
                  <p>User Email: {user?.email}</p>
                  <p>Is Karla: {isKarla ? 'Yes' : 'No'}</p>
                  <p>Is Admin: {isAdmin ? 'Yes' : 'No'}</p>
                  <p>Can Edit: {canEdit ? 'Yes' : 'No'}</p>
                  <p>Current Week ID: {currentWeekData?.id}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* KPI Cards - visible for all */}
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
        
        {/* Admin View */}
        {isAdmin && !isKarla && (
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
              }))}
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
