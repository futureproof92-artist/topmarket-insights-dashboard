
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface GenerateWeeksButtonProps {
  onSuccess?: () => void;
}

export const GenerateWeeksButton = ({ onSuccess }: GenerateWeeksButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateFutureWeeks = async () => {
    setIsGenerating(true);

    try {
      // Obtenemos la fecha de la última semana
      const { data: existingWeeks, error: fetchError } = await supabase
        .from('reclutamiento')
        .select('semana_inicio, semana_fin')
        .order('semana_inicio', { ascending: false })
        .limit(1);

      if (fetchError) {
        throw new Error(`Error obteniendo la última semana: ${fetchError.message}`);
      }

      if (!existingWeeks || existingWeeks.length === 0) {
        throw new Error("No se encontraron semanas existentes");
      }

      const lastWeekEnd = new Date(existingWeeks[0].semana_fin);
      const newWeeks = [];

      // Generamos 8 semanas adicionales
      for (let i = 1; i <= 8; i++) {
        const startDate = new Date(lastWeekEnd);
        startDate.setDate(lastWeekEnd.getDate() + (i * 7) - 6); // Empezamos desde el lunes siguiente a la última semana

        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6); // Domingo de esa semana

        newWeeks.push({
          semana: `semana-${startDate.toISOString().split('T')[0]}`,
          semana_inicio: startDate.toISOString().split('T')[0],
          semana_fin: endDate.toISOString().split('T')[0],
          reclutamientos_confirmados: 0,
          freelancers_confirmados: 0
        });
      }

      // Insertamos las nuevas semanas
      const { error: insertError } = await supabase
        .from('reclutamiento')
        .insert(newWeeks);

      if (insertError) {
        throw new Error(`Error generando nuevas semanas: ${insertError.message}`);
      }

      toast({
        title: "Semanas generadas",
        description: `Se han generado ${newWeeks.length} semanas adicionales correctamente.`
      });

      // Llamamos al callback de éxito si existe
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("[WEEKS_GENERATOR] Error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error generando las semanas",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
      onClick={generateFutureWeeks} 
      disabled={isGenerating}
      variant="secondary"
      className="flex items-center gap-2"
    >
      {isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
      {isGenerating ? "Generando..." : "Generar semanas futuras"}
    </Button>
  );
};
