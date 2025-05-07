
import React, { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DeleteDataButtonProps {
  tableName: string;
  semanaId: string;
  semana: string;
  deleteAllData?: boolean;
  buttonText?: string;
  buttonVariant?: 'destructive' | 'outline' | 'default' | 'ghost' | 'link' | 'secondary';
  onSuccess?: () => void;
}

export const DeleteDataButton = ({
  tableName,
  semanaId,
  semana,
  deleteAllData = false,
  buttonText = 'Eliminar',
  buttonVariant = 'outline',
  onSuccess
}: DeleteDataButtonProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const handleDelete = async () => {
    setLoading(true);
    try {
      console.log(`Eliminando datos de ${tableName} con ID: ${semanaId}`);
      
      // Handle different table structures
      if (tableName === 'historial_semanal') {
        // First delete related ventas_detalle records
        const { error: deleteVentasError } = await supabase
          .from('ventas_detalle')
          .delete()
          .eq('historial_id', semanaId);
          
        if (deleteVentasError) {
          console.error('Error al eliminar ventas_detalle:', deleteVentasError);
          throw deleteVentasError;
        }
        
        // Then delete the historial_semanal record
        const { error: deleteHistorialError } = await supabase
          .from('historial_semanal')
          .delete()
          .eq('id', semanaId);
          
        if (deleteHistorialError) {
          console.error('Error al eliminar historial_semanal:', deleteHistorialError);
          throw deleteHistorialError;
        }
      } else {
        // For other tables (cobranza, reclutamiento, etc.) just delete the record
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', semanaId);
          
        if (error) {
          console.error(`Error al eliminar datos de ${tableName}:`, error);
          throw error;
        }
      }
      
      toast({
        title: 'Datos eliminados',
        description: `Los datos de la semana ${semana} han sido eliminados correctamente`
      });
      
      // Call onSuccess callback if provided
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess();
      }
      
    } catch (error) {
      console.error('Error en Delete operation:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron eliminar los datos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={buttonVariant} size="sm" disabled={loading}>
          <Trash2 className="h-4 w-4 mr-1" />
          {buttonText}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar datos</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que deseas eliminar los datos de la semana {semana}?
            {deleteAllData && <p className="font-bold text-red-500 mt-2">Esta acción eliminará todos los datos relacionados con esta semana y no se podrán recuperar.</p>}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
            {loading ? 'Eliminando...' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
