
import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AppShell } from '@/components/layout/AppShell';
import { ChartContainer } from '@/components/dashboard/ChartContainer';
import { KpiTable } from '@/components/dashboard/KpiTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DateRangeWeekSelector } from '@/components/dashboard/DateRangeWeekSelector';
import { GenerateWeeksButton } from '@/components/dashboard/GenerateWeeksButton';
import { useRecruitmentData } from '@/hooks/use-recruitment-data';
import { useAuth } from '@/hooks/use-auth';
import { formatWeekLabel } from '@/utils/dateUtils';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Shield, Info } from "lucide-react";

const ReclutamientoPage = () => {
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
    saveRecruitmentData
  } = useRecruitmentData();
  
  const { user, isKarla, isAdmin } = useAuth();
  
  // Determine if the user can edit data
  const canEdit = isKarla || isAdmin;
  
  // Create chart data for visualization
  const recruitmentChartData = weeksData
    .slice(Math.max(0, weeksData.length - 12))
    .map(week => ({
      name: formatWeekLabel(week.semana_inicio, week.semana_fin),
      reclutamientos: week.reclutamientos_confirmados,
      freelancers: week.freelancers_confirmados
    }))
    .reverse();

  // Loading state
  if (!user) {
    return <div>Cargando...</div>;
  }

  // Create an adapted user object matching the expected AppShell structure
  const appShellUser = {
    email: user.email || '',
    role: isAdmin ? 'admin' : (isKarla ? 'karla' : 'user')
  };

  // Current week label for display
  const currentWeekLabel = currentWeekData 
    ? formatWeekLabel(currentWeekData.semana_inicio, currentWeekData.semana_fin)
    : "No hay semana seleccionada";

  // Check if we're at the last available week
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
              <GenerateWeeksButton onSuccess={() => {}} />
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
                onClick={saveRecruitmentData} 
                className="mt-4"
                disabled={loading || isSaving || !currentWeekData}
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </Button>
              
              {/* Debug info - only for admin */}
              {isAdmin && (
                <div className="mt-4 p-3 bg-slate-100 rounded-md text-xs text-slate-600">
                  <p>Debug info (sólo admin):</p>
                  <p>User Email: {user?.email}</p>
                  <p>Is Karla: {isKarla ? 'Yes' : 'No'}</p>
                  <p>Is Admin: {isAdmin ? 'Yes' : 'No'}</p>
                  <p>Can Edit: {canEdit ? 'Yes' : 'No'}</p>
                  <p>Current Week ID: {currentWeekData?.id}</p>
                  <p>Total Weeks: {weeksData.length}</p>
                  <p>Current Week Index: {currentWeekIndex}</p>
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
        
        {/* Admin View - Charts and Tables */}
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
