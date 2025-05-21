
import React, { useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ChartContainer } from '@/components/dashboard/ChartContainer';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { DeleteRecordButton } from '@/components/admin/DeleteRecordButton';
import { DateRangeWeekSelector } from '@/components/dashboard/DateRangeWeekSelector';
import { formatWeekLabel } from '@/utils/dateUtils';
import { usePxrCerradosData } from '@/hooks/use-pxr-cerrados-data';
import { useAuth } from '@/hooks/use-auth';

const PxrCerradosPage = () => {
  const { toast } = useToast();
  
  // Usar el hook personalizado para manejar los datos de PXR cerrados
  const {
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
  } = usePxrCerradosData();

  // Obtener información del usuario actual y sus permisos
  const { user, isDavila, isAdmin, hasPxrAccess } = useAuth();
  
  // Añadir console logs para debugging
  useEffect(() => {
    console.log("[PXR_PAGE] Estado inicial:", {
      weeksDataLength: weeksData.length,
      currentWeekIndex,
      currentWeekData: currentWeekData ? {
        semana: currentWeekData.semana,
        id: currentWeekData.id
      } : null,
      loading,
      error
    });
  }, [weeksData, currentWeekIndex, currentWeekData, loading, error]);
  
  // Transformar el objeto user al formato esperado por AppShell
  const appShellUser = user ? {
    role: user.role || user.user_metadata?.role || 'user', // Ensure role is defined
    email: user.email || ''
  } : undefined;

  // Preparar datos para el gráfico
  const chartData = weeksData.map(week => ({
    name: week.semana,
    pxr_cerrados: week.total_pxr_cerrados,
  }));

  // Formatear la etiqueta de la semana actual
  const currentWeekLabel = currentWeekData 
    ? formatWeekLabel(currentWeekData.semana_inicio, currentWeekData.semana_fin)
    : "Cargando...";
  
  // Verificar si hay datos antes de renderizar
  useEffect(() => {
    if (!loading && weeksData.length === 0) {
      console.log("[PXR_PAGE] No hay datos de semanas disponibles. Intentando cargar nuevamente...");
      fetchPxrCerradosData();
    }
  }, [loading, weeksData, fetchPxrCerradosData]);

  return (
    <AppShell user={appShellUser}>
      <div className="space-y-6">
        {/* Selector de semanas */}
        <DateRangeWeekSelector
          currentIndex={currentWeekIndex}
          totalWeeks={weeksData.length}
          currentWeekLabel={currentWeekLabel}
          onPrevious={goToPreviousWeek}
          onNext={goToNextWeek}
          loading={loading}
        />
        
        {/* Formulario de edición (solo visible para usuarios autorizados) */}
        {hasPxrAccess && (
          <Card>
            <CardHeader>
              <CardTitle>Registro de PXRs cerrados</CardTitle>
              <CardDescription>
                {currentWeekData ? 
                  `Ingresa los datos de PXRs cerrados para ${currentWeekLabel}` : 
                  "Selecciona una semana para ingresar datos"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div>
                  <Label htmlFor="total_pxr_cerrados">Total de PXRs cerrados:</Label>
                  <Input
                    type="number"
                    id="total_pxr_cerrados"
                    name="total_pxr_cerrados"
                    value={formData.total_pxr_cerrados}
                    onChange={handleFormChange}
                    disabled={loading || !currentWeekData}
                  />
                </div>
                <div>
                  <Label htmlFor="mejores_cuentas">Comentarios sobre mejores cuentas:</Label>
                  <Textarea
                    id="mejores_cuentas"
                    name="mejores_cuentas"
                    value={formData.mejores_cuentas}
                    onChange={handleFormChange}
                    disabled={loading || !currentWeekData}
                    placeholder="Describe las mejores cuentas o añade comentarios relevantes"
                    className="min-h-[100px]"
                  />
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-between">
              {isAdmin && currentWeekData && (
                <DeleteRecordButton
                  tableName="pxr_cerrados"
                  recordId={currentWeekData.id}
                  onSuccess={() => window.location.reload()}
                  buttonText="Eliminar registro"
                  buttonVariant="outline"
                />
              )}
              <div className="ml-auto">
                <Button 
                  onClick={savePxrCerradosData} 
                  disabled={isSaving || loading || !currentWeekData}
                >
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}
        
        {/* Gráfico */}
        <ChartContainer
          title="Historial de PXRs cerrados"
          data={chartData}
          series={[{ name: 'PXRs Cerrados', dataKey: 'pxr_cerrados', color: '#82ca9d' }]}
          type="line"
        />
        
        {/* Resumen semanal */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen Semanal</CardTitle>
            <CardDescription>
              Historial de PXRs cerrados por semana
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8">Cargando datos...</p>
            ) : weeksData.length === 0 ? (
              <p className="text-center py-8">No hay datos disponibles</p>
            ) : (
              <div className="space-y-6">
                {weeksData.slice().reverse().slice(0, 10).map((week) => (
                  <div key={week.id} className="border-b pb-4 last:border-0">
                    <h3 className="text-lg font-semibold">
                      {formatWeekLabel(week.semana_inicio, week.semana_fin)}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      <div>
                        <p className="text-sm font-medium">Total de PXRs cerrados:</p>
                        <p className="text-2xl font-bold">{week.total_pxr_cerrados}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Comentarios:</p>
                        <p className="text-sm text-gray-600">{week.mejores_cuentas || "Sin comentarios"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
};

export default PxrCerradosPage;
