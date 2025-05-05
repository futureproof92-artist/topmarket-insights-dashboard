
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DeleteDataButtonProps {
  tableName: string;
  recordId?: string;
  semanaId?: string;
  semana?: string;
  onSuccess?: () => void;
  buttonText?: string;
  deleteAllData?: boolean;
  buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | null;
}

export const DeleteDataButton = ({
  tableName,
  recordId,
  semanaId,
  semana,
  onSuccess,
  buttonText = 'Eliminar',
  deleteAllData = false,
  buttonVariant = 'destructive'
}: DeleteDataButtonProps) => {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      // Verificar la sesión activa
      const { data: sessionData } = await supabase.auth.getSession();
      console.log("[DELETE_DEBUG] Sesión al eliminar datos:", 
        sessionData?.session ? "Activa" : "No hay sesión"
      );
      
      if (!sessionData?.session) {
        throw new Error("No hay sesión activa. Por favor, inicia sesión nuevamente.");
      }

      let error;

      if (deleteAllData && semana) {
        // Eliminar todos los datos de una semana específica
        console.log(`[DELETE_DEBUG] Eliminando todos los datos de la semana ${semana} en la tabla ${tableName}`);
        
        if (tableName === 'historial_semanal') {
          // Primero eliminamos los registros de ventas_detalle asociados
          const { error: ventasError } = await supabase
            .from('ventas_detalle')
            .delete()
            .eq('historial_id', semanaId);
          
          if (ventasError) {
            console.error("[DELETE_DEBUG] Error al eliminar detalles de ventas:", ventasError);
            throw ventasError;
          }
          
          // Luego eliminamos el registro del historial
          const { error: historialError } = await supabase
            .from(tableName)
            .delete()
            .eq('id', semanaId);
            
          error = historialError;
        } else {
          // Para otras tablas, eliminamos por semana
          const { error: deleteError } = await supabase
            .from(tableName)
            .delete()
            .eq('semana', semana);
            
          error = deleteError;
        }
      } else if (recordId) {
        // Eliminar un registro específico
        console.log(`[DELETE_DEBUG] Eliminando registro con ID ${recordId} de la tabla ${tableName}`);
        
        const { error: deleteError } = await supabase
          .from(tableName)
          .delete()
          .eq('id', recordId);
          
        error = deleteError;
      } else {
        throw new Error("No se proporcionó un ID de registro o información de semana para eliminar.");
      }

      if (error) {
        console.error("[DELETE_DEBUG] Error al eliminar datos:", error);
        throw error;
      }

      toast({
        title: "Éxito",
        description: "Datos eliminados correctamente",
      });

      // Cerrar el diálogo y ejecutar callback
      setOpen(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("[DELETE_DEBUG] Error en la operación de eliminación:", error);
      
      let errorMessage = "No se pudieron eliminar los datos";
      
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      } else if (typeof error === 'object' && error !== null) {
        // Si es un error de Supabase
        const supabaseError = error as any;
        if (supabaseError.message) {
          errorMessage += `: ${supabaseError.message}`;
        }
        if (supabaseError.details) {
          errorMessage += ` (${supabaseError.details})`;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button 
        variant={buttonVariant} 
        size="sm" 
        onClick={() => setOpen(true)}
        disabled={isDeleting}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        {buttonText}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteAllData 
                ? `Esta acción eliminará todos los datos de la semana seleccionada en ${tableName}. Esta acción no se puede deshacer.`
                : `Esta acción eliminará el registro seleccionado de ${tableName}. Esta acción no se puede deshacer.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
