
import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { addDays, startOfWeek, format, getDay, parse, eachWeekOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { LeadsForm } from '@/components/ventas/LeadsForm';
import { VentasDetalleForm } from '@/components/ventas/VentasDetalleForm';
import { HistorialSemanal } from '@/components/ventas/HistorialSemanal';
import { VentasResumenAgregado } from '@/components/ventas/VentasResumenAgregado';
import { DateRangeSelector } from '@/components/ventas/DateRangeSelector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WeekRange {
  startDate: Date;
  endDate: Date;
  displayText: string;
}

interface LeadsData {
  leads_pub_em: number;
  leads_pub_cl: number;
  leads_frio_em: number;
  leads_frio_cl: number;
  ventas_cerradas: number;
}

export interface VentaDetalle {
  id: string;
  cliente: string;
  ubicacion: string;
  tipo_servicio: 'PXR' | 'HH' | 'OTRO';
  costo_unitario: number;
  total_vacs: number;
}

const VentasPage = () => {
  const [user, setUser] = useState<{
    role: string;
    email: string;
  } | null>(null);
  
  const [currentWeek, setCurrentWeek] = useState<WeekRange>(() => {
    const now = new Date();
    return getWeekRange(now);
  });

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfWeek(new Date(), { weekStartsOn: 1 }),
    to: addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 28)
  });

  const [leadsData, setLeadsData] = useState<LeadsData>({
    leads_pub_em: 0,
    leads_pub_cl: 0,
    leads_frio_em: 0,
    leads_frio_cl: 0,
    ventas_cerradas: 0
  });

  const [ventasDetalle, setVentasDetalle] = useState<VentaDetalle[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [historialSemanas, setHistorialSemanas] = useState<{
    semana: string;
    leads: LeadsData;
    ventasDetalle: VentaDetalle[];
  }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Efecto para cargar el usuario y configurar la interfaz inicial
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setIsAdmin(parsedUser.role === 'admin' || parsedUser.email?.includes('sergio.t@topmarket.com.mx'));
    }
    
    loadHistorialSemanas();
    cargarDatosSemanaActual();
  }, []);

  // Efecto para filtrar datos cuando cambia el rango de fechas
  useEffect(() => {
    if (!dateRange?.from) return;
    console.log("Filtrando datos por rango de fechas:", dateRange);
  }, [dateRange]);

  // Función para cargar el historial de semanas desde Supabase
  const loadHistorialSemanas = async () => {
    try {
      setIsLoading(true);
      
      // Obtener todas las entradas del historial semanal
      const { data: historialData, error: historialError } = await supabase
        .from('historial_semanal')
        .select('*')
        .order('fecha_inicio', { ascending: false });
        
      if (historialError) throw historialError;
      
      if (!historialData || historialData.length === 0) {
        setHistorialSemanas([]);
        setIsLoading(false);
        return;
      }
      
      // Para cada semana, obtener sus ventas detalle
      const historialCompleto = await Promise.all(
        historialData.map(async (semana) => {
          const { data: ventasData, error: ventasError } = await supabase
            .from('ventas_detalle')
            .select('*')
            .eq('historial_id', semana.id);
            
          if (ventasError) throw ventasError;
          
          // Convertir los tipos de servicio de string a los tipos específicos
          const ventasFormateadas: VentaDetalle[] = ventasData ? ventasData.map(venta => ({
            id: venta.id,
            cliente: venta.cliente,
            ubicacion: venta.ubicacion,
            tipo_servicio: venta.tipo_servicio as 'PXR' | 'HH' | 'OTRO',
            costo_unitario: Number(venta.costo_unitario),
            total_vacs: venta.total_vacs
          })) : [];
          
          return {
            semana: semana.semana,
            leads: {
              leads_pub_em: semana.leads_pub_em || 0,
              leads_pub_cl: semana.leads_pub_cl || 0,
              leads_frio_em: semana.leads_frio_em || 0,
              leads_frio_cl: semana.leads_frio_cl || 0,
              ventas_cerradas: semana.ventas_cerradas || 0
            },
            ventasDetalle: ventasFormateadas
          };
        })
      );
      
      setHistorialSemanas(historialCompleto);
    } catch (error) {
      console.error("Error al cargar el historial:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el historial de semanas",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Función para cargar los datos de la semana actual
  const cargarDatosSemanaActual = async () => {
    try {
      // Verificar si ya existen datos para la semana actual
      const { data: semanaExistente, error: errorBusqueda } = await supabase
        .from('historial_semanal')
        .select('*')
        .eq('semana', currentWeek.displayText)
        .maybeSingle();
        
      if (errorBusqueda && errorBusqueda.code !== 'PGRST116') {
        throw errorBusqueda;
      }
      
      if (semanaExistente) {
        // Cargar los datos de la semana
        setLeadsData({
          leads_pub_em: semanaExistente.leads_pub_em || 0,
          leads_pub_cl: semanaExistente.leads_pub_cl || 0,
          leads_frio_em: semanaExistente.leads_frio_em || 0,
          leads_frio_cl: semanaExistente.leads_frio_cl || 0,
          ventas_cerradas: semanaExistente.ventas_cerradas || 0
        });
        
        // Cargar las ventas detalle
        const { data: ventasData, error: ventasError } = await supabase
          .from('ventas_detalle')
          .select('*')
          .eq('historial_id', semanaExistente.id);
          
        if (ventasError) throw ventasError;
        
        if (ventasData && ventasData.length > 0) {
          // Convertir los tipos de servicio de string a los tipos específicos
          const ventasFormateadas: VentaDetalle[] = ventasData.map(venta => ({
            id: venta.id,
            cliente: venta.cliente,
            ubicacion: venta.ubicacion,
            tipo_servicio: venta.tipo_servicio as 'PXR' | 'HH' | 'OTRO',
            costo_unitario: Number(venta.costo_unitario),
            total_vacs: venta.total_vacs
          }));
          
          setVentasDetalle(ventasFormateadas);
        } else {
          // Si no hay ventas detalle pero sí hay ventas cerradas, crear filas vacías
          if (semanaExistente.ventas_cerradas > 0) {
            updateVentasDetalleRows(semanaExistente.ventas_cerradas);
          } else {
            setVentasDetalle([]);
          }
        }
      } else {
        // Si no existen datos para esta semana, inicializar con valores por defecto
        setLeadsData({
          leads_pub_em: 0,
          leads_pub_cl: 0,
          leads_frio_em: 0,
          leads_frio_cl: 0,
          ventas_cerradas: 0
        });
        setVentasDetalle([]);
      }
    } catch (error) {
      console.error("Error al cargar datos de la semana actual:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de la semana actual",
        variant: "destructive"
      });
    }
  };

  function getWeekRange(date: Date): WeekRange {
    const startDate = startOfWeek(date, {
      weekStartsOn: 1
    });
    const endDate = addDays(startDate, 4);
    const displayText = `Lun ${format(startDate, "d 'de' MMM yyyy", {
      locale: es
    })} – Vie ${format(endDate, "d 'de' MMM yyyy", {
      locale: es
    })}`;
    return {
      startDate,
      endDate,
      displayText
    };
  }

  const prevWeek = () => {
    const prevWeekStart = addDays(currentWeek.startDate, -7);
    setCurrentWeek(getWeekRange(prevWeekStart));
    cargarDatosSemanaActual();
  };

  const nextWeek = () => {
    const nextWeekStart = addDays(currentWeek.startDate, 7);
    setCurrentWeek(getWeekRange(nextWeekStart));
    cargarDatosSemanaActual();
  };

  const updateVentasDetalleRows = (ventasCerradas: number) => {
    const currentLength = ventasDetalle.length;
    if (ventasCerradas > currentLength) {
      const newRows = Array.from({
        length: ventasCerradas - currentLength
      }, (_, i) => ({
        id: `new-${Date.now()}-${i}`,
        cliente: '',
        ubicacion: '',
        tipo_servicio: 'PXR' as 'PXR' | 'HH' | 'OTRO',
        costo_unitario: 0,
        total_vacs: 1
      }));
      setVentasDetalle([...ventasDetalle, ...newRows]);
    } else if (ventasCerradas < currentLength) {
      setVentasDetalle(ventasDetalle.slice(0, ventasCerradas));
    }
  };

  const handleLeadsChange = (newLeadsData: LeadsData) => {
    setLeadsData(newLeadsData);
    updateVentasDetalleRows(newLeadsData.ventas_cerradas);
  };

  const handleVentaDetalleChange = (index: number, field: keyof VentaDetalle, value: any) => {
    const updatedVentas = [...ventasDetalle];
    updatedVentas[index] = {
      ...updatedVentas[index],
      [field]: value
    };
    setVentasDetalle(updatedVentas);
  };

  const handleSaveWeekData = async () => {
    try {
      setIsLoading(true);
      
      // Verificar si ya existe un registro para esta semana
      const { data: existingSemana, error: searchError } = await supabase
        .from('historial_semanal')
        .select('id')
        .eq('semana', currentWeek.displayText)
        .maybeSingle();
        
      if (searchError) throw searchError;
      
      let historial_id;
      
      if (existingSemana?.id) {
        // Actualizar registro existente
        historial_id = existingSemana.id;
        
        const { error: updateError } = await supabase
          .from('historial_semanal')
          .update({
            leads_pub_em: leadsData.leads_pub_em,
            leads_pub_cl: leadsData.leads_pub_cl,
            leads_frio_em: leadsData.leads_frio_em,
            leads_frio_cl: leadsData.leads_frio_cl,
            ventas_cerradas: leadsData.ventas_cerradas,
            updated_at: new Date().toISOString()
          })
          .eq('id', historial_id);
          
        if (updateError) throw updateError;
      } else {
        // Crear nuevo registro
        const { data: newSemana, error: insertError } = await supabase
          .from('historial_semanal')
          .insert({
            semana: currentWeek.displayText,
            fecha_inicio: currentWeek.startDate.toISOString(),
            fecha_fin: currentWeek.endDate.toISOString(),
            leads_pub_em: leadsData.leads_pub_em,
            leads_pub_cl: leadsData.leads_pub_cl,
            leads_frio_em: leadsData.leads_frio_em,
            leads_frio_cl: leadsData.leads_frio_cl,
            ventas_cerradas: leadsData.ventas_cerradas
          })
          .select('id')
          .single();
          
        if (insertError) throw insertError;
        historial_id = newSemana.id;
      }
      
      // Eliminar ventas detalle anteriores para esta semana
      const { error: deleteError } = await supabase
        .from('ventas_detalle')
        .delete()
        .eq('historial_id', historial_id);
        
      if (deleteError) throw deleteError;
      
      // Guardar nuevas ventas detalle
      if (ventasDetalle.length > 0) {
        const ventasParaGuardar = ventasDetalle.map(venta => ({
          historial_id,
          cliente: venta.cliente,
          ubicacion: venta.ubicacion,
          tipo_servicio: venta.tipo_servicio,
          costo_unitario: venta.costo_unitario,
          total_vacs: venta.total_vacs
        }));
        
        const { error: insertVentasError } = await supabase
          .from('ventas_detalle')
          .insert(ventasParaGuardar);
          
        if (insertVentasError) throw insertVentasError;
      }
      
      // Recargar el historial
      await loadHistorialSemanas();
      
      toast({
        title: "Éxito",
        description: "Información semanal guardada correctamente",
        variant: "default"
      });
      
    } catch (error) {
      console.error("Error al guardar datos:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la información semanal",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  if (!user) {
    return <div>Cargando...</div>;
  }

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        {isAdmin ? (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Panel de Ventas (Eve)</h1>
            <DateRangeSelector dateRange={dateRange} onDateRangeChange={handleDateRangeChange} />
            
            <Tabs defaultValue="resumen" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="resumen">Resumen Agregado</TabsTrigger>
                <TabsTrigger value="detalle">Detalle Semanal</TabsTrigger>
              </TabsList>
              
              <TabsContent value="resumen">
                <VentasResumenAgregado historial={historialSemanas} dateRange={dateRange} />
              </TabsContent>
              
              <TabsContent value="detalle">
                <HistorialSemanal historial={historialSemanas} />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border p-4 rounded-md bg-slate-700">
              <Button variant="outline" size="icon" onClick={prevWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <h2 className="text-lg font-semibold">
                {currentWeek.displayText}
              </h2>
              
              <Button variant="outline" size="icon" onClick={nextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Tabs defaultValue="registro" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="registro">Registro Semanal</TabsTrigger>
                <TabsTrigger value="historial">Historial</TabsTrigger>
              </TabsList>
              
              <TabsContent value="registro" className="space-y-4">
                <LeadsForm leadsData={leadsData} onLeadsChange={handleLeadsChange} />
                
                {leadsData.ventas_cerradas > 0 && <VentasDetalleForm ventasDetalle={ventasDetalle} onVentaDetalleChange={handleVentaDetalleChange} />}
                
                <Button className="w-full mt-4 bg-topmarket hover:bg-topmarket/90" onClick={handleSaveWeekData}>
                  Guardar Información Semanal
                </Button>
              </TabsContent>
              
              <TabsContent value="historial">
                <HistorialSemanal historial={historialSemanas} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AppShell>
  );
};

export default VentasPage;
