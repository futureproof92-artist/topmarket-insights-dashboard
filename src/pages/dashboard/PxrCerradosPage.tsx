import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DeleteRecordButton } from '@/components/admin/DeleteRecordButton';

// Interfaces
interface PxrCerradosData {
  id: string;
  semana: string;
  semana_inicio: string;
  semana_fin: string;
  total_pxr_cerrados: number;
  comentarios: string;
  created_at: string;
  updated_at: string;
}

interface WeeklyData {
  semana_inicio: string;
  semana_fin: string;
  total_pxr_cerrados: number;
  comentarios: string;
}

// Constantes
const initialFormData = {
  total_pxr_cerrados: 0,
  comentarios: '',
};

const PxrCerradosPage = () => {
  // Hooks
  const { toast } = useToast();
  const [user, setUser] = useState<{ role: string; email: string } | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentWeekDates, setCurrentWeekDates] = useState('');
  const [currentWeek, setCurrentWeek] = useState<PxrCerradosData | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [weeklySummaries, setWeeklySummaries] = useState<PxrCerradosData[]>([]);

  // Estados para la paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5); // Puedes ajustar este valor
  
  // Calcular el índice del primer y último elemento en la página actual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentWeeklySummaries = weeklySummaries.slice(indexOfFirstItem, indexOfLastItem);

  // Función para cambiar de página
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  
  // Calcular el número total de páginas
  const totalPages = Math.ceil(weeklySummaries.length / itemsPerPage);

  // Determinar si el usuario actual es Davila
  const isDavilaUser = user?.email?.toLowerCase().includes('rys_cdmx') || user?.email?.toLowerCase().includes('davila');
  const isAdmin = user?.role === 'admin';

  // Efecto para cargar el usuario desde localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Efecto para actualizar las fechas de la semana actual
  useEffect(() => {
    const startOfWeek = format(currentDate, 'yyyy-MM-dd', { locale: es });
    const endOfWeek = format(new Date(currentDate.setDate(currentDate.getDate() + 6)), 'yyyy-MM-dd', { locale: es });
    setCurrentWeekDates(`${startOfWeek} - ${endOfWeek}`);
  }, [currentDate]);

  // Efecto para cargar los datos de la semana actual
  useEffect(() => {
    const fetchCurrentWeekData = async () => {
      try {
        const { data, error } = await supabase
          .from('pxr_cerrados')
          .select('*')
          .eq('semana', currentWeekDates)
          .single();

        if (error) {
          console.error('Error fetching current week data:', error);
        }

        if (data) {
          setCurrentWeek(data);
          setFormData({
            total_pxr_cerrados: data.total_pxr_cerrados,
            comentarios: data.comentarios,
          });
        } else {
          setCurrentWeek(null);
          setFormData(initialFormData);
        }
      } catch (error) {
        console.error('Error fetching current week data:', error);
      }
    };

    fetchCurrentWeekData();
  }, [currentWeekDates]);

  // Efecto para cargar el historial semanal
  useEffect(() => {
    const fetchWeeklySummaries = async () => {
      try {
        const { data, error } = await supabase
          .from('pxr_cerrados')
          .select('*')
          .order('semana_inicio', { ascending: false });

        if (error) {
          console.error('Error fetching weekly summaries:', error);
        }

        if (data) {
          setWeeklySummaries(data);
        }
      } catch (error) {
        console.error('Error fetching weekly summaries:', error);
      }
    };

    fetchWeeklySummaries();
  }, []);

  // Efecto para preparar los datos del gráfico
  useEffect(() => {
    const prepareChartData = () => {
      const chartData = weeklySummaries.map(item => ({
        name: item.semana,
        pxr_cerrados: item.total_pxr_cerrados,
      }));
      setChartData(chartData);
    };

    prepareChartData();
  }, [weeklySummaries]);

  // Función para manejar el cambio de fecha
  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
  };

  // Función para manejar los cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Función para guardar los datos
  const handleSaveData = async () => {
    setIsSaving(true);
    try {
      if (currentWeek) {
        // Actualizar registro existente
        const { error } = await supabase
          .from('pxr_cerrados')
          .update({
            total_pxr_cerrados: parseInt(formData.total_pxr_cerrados.toString()),
            comentarios: formData.comentarios,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentWeek.id);

        if (error) {
          console.error('Error updating data:', error);
          toast({
            title: 'Error',
            description: 'No se pudieron actualizar los datos',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Éxito',
            description: 'Datos actualizados correctamente',
          });
        }
      } else {
        // Crear nuevo registro
        const { error } = await supabase
          .from('pxr_cerrados')
          .insert([
            {
              semana: currentWeekDates,
              semana_inicio: currentWeekDates.split(' - ')[0],
              semana_fin: currentWeekDates.split(' - ')[1],
              total_pxr_cerrados: parseInt(formData.total_pxr_cerrados.toString()),
              comentarios: formData.comentarios,
            },
          ]);

        if (error) {
          console.error('Error creating data:', error);
          toast({
            title: 'Error',
            description: 'No se pudieron guardar los datos',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Éxito',
            description: 'Datos guardados correctamente',
          });
        }
      }
    } catch (error) {
      console.error('Error saving data:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error al guardar los datos',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Función para eliminar un registro
  const handleDeleteRecord = async () => {
    try {
      setIsDeleting(true);
      
      if (!currentWeek) {
        toast({
          title: 'Error',
          description: 'No hay registro para eliminar',
          variant: 'destructive',
        });
        return;
      }
      
      const { error } = await supabase
        .from('pxr_cerrados')
        .delete()
        .eq('id', currentWeek.id);
        
      if (error) {
        console.error('Error deleting record:', error);
        toast({
          title: 'Error',
          description: 'No se pudo eliminar el registro',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Éxito',
          description: 'Registro eliminado correctamente',
        });
        // Limpiar el estado después de eliminar
        setCurrentWeek(null);
        setFormData(initialFormData);
      }
    } catch (error) {
      console.error('Error in delete operation:', error);
      toast({
        title: 'Error',
        description: 'Error al eliminar el registro',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Renderizado condicional para mostrar el número de página actual
  const renderPageNumbers = () => {
    const pageNumbers = [];

    // Mostrar la primera página
    pageNumbers.push(
      <Button
        key={1}
        variant={currentPage === 1 ? "default" : "outline"}
        onClick={() => paginate(1)}
        disabled={currentPage === 1}
      >
        1
      </Button>
    );

    // Mostrar "..." si hay más de 2 páginas entre la primera y la actual
    if (currentPage > 3) {
      pageNumbers.push(<span key="dots-start">...</span>);
    }

    // Mostrar la página anterior a la actual, la actual y la siguiente
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pageNumbers.push(
        <Button
          key={i}
          variant={currentPage === i ? "default" : "outline"}
          onClick={() => paginate(i)}
        >
          {i}
        </Button>
      );
    }

    // Mostrar "..." si hay más de 2 páginas entre la actual y la última
    if (currentPage < totalPages - 2) {
      pageNumbers.push(<span key="dots-end">...</span>);
    }

    // Mostrar la última página
    if (totalPages > 1) {
      pageNumbers.push(
        <Button
          key={totalPages}
          variant={currentPage === totalPages ? "default" : "outline"}
          onClick={() => paginate(totalPages)}
          disabled={currentPage === totalPages}
        >
          {totalPages}
        </Button>
      );
    }

    return pageNumbers;
  };
  
  return (
    <AppShell user={user}>
      <div className="space-y-6">
        {/* Selector de fecha */}
        <div>
          <Label htmlFor="date">Selecciona la semana:</Label>
          <Input
            type="date"
            id="date"
            value={format(currentDate, 'yyyy-MM-dd')}
            onChange={(e) => handleDateChange(new Date(e.target.value))}
          />
          <p>Semana seleccionada: {currentWeekDates}</p>
        </div>
        
        {/* Formulario de edición */}
        {isDavilaUser && (
          <Card>
            <CardHeader>
              <CardTitle>Registro de PXRs cerrados</CardTitle>
              <CardDescription>
                Ingresa los datos de PXRs cerrados para la semana {currentWeekDates}
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
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="comentarios">Comentarios:</Label>
                  <Textarea
                    id="comentarios"
                    name="comentarios"
                    value={formData.comentarios}
                    onChange={handleInputChange}
                  />
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-between">
              {isAdmin && currentWeek && (
                <DeleteRecordButton
                  tableName="pxr_cerrados"
                  recordId={currentWeek.id}
                  onSuccess={handleDeleteRecord}
                  buttonText="Eliminar registro"
                  buttonVariant="outline"
                />
              )}
              <div className="ml-auto">
                <Button onClick={handleSaveData} disabled={isSaving || isDeleting}>
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
            {currentWeeklySummaries.map((item) => (
              <div key={item.id} className="mb-4">
                <h3 className="text-lg font-semibold">{item.semana}</h3>
                <p>Total de PXRs cerrados: {item.total_pxr_cerrados}</p>
                <p>Comentarios: {item.comentarios}</p>
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex justify-center space-x-2">
            {renderPageNumbers()}
          </CardFooter>
        </Card>
      </div>
    </AppShell>
  );
};

export default PxrCerradosPage;
