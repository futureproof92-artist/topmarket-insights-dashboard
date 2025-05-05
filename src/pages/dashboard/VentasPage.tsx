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
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

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
  console.log("[VENTAS_DEBUG] Inicializando VentasPage");
  const { user: authUser, userRole, loading: authLoading, session } = useAuth();
  console.log("[VENTAS_DEBUG] Estado de autenticación:", { authLoading, userRole, hasUser: !!authUser, hasSession: !!session });
  
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  // Efecto para cargar el usuario y configurar la interfaz inicial
  useEffect(() => {
    console.log("[VENTAS_DEBUG] useEffect para cargar usuario");
    
    // Usar el usuario de AuthContext si está disponible
    if (authUser && !authLoading) {
      const userData = {
        role: userRole || 'user',
        email: authUser.email || ''
      };
      console.log("[VENTAS_DEBUG] Estableciendo usuario desde AuthContext:", userData);
      setUser(userData);
      
      // Verificar si es admin
      setIsAdmin(userData.role === 'admin' || userData.email?.includes('sergio.t@topmarket.com.mx'));
    } 
    // Fallback al localStorage si no hay usuario en AuthContext
    else {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        console.log("[VENTAS_DEBUG] Estableciendo usuario desde localStorage:", parsedUser);
        setUser(parsedUser);
        setIsAdmin(parsedUser.role === 'admin' || parsedUser.email?.includes('sergio.t@topmarket.com.mx'));
      } else {
        console.log("[VENTAS_DEBUG] ⚠️ No se encontró usuario en localStorage ni en AuthContext");
      }
    }
    
    loadHistorialSemanas();
    cargarDatosSemanaActual();
  }, [authUser, authLoading, userRole]);

  // Efecto para filtrar datos cuando cambia el rango de fechas
  useEffect(() => {
    if (!dateRange?.from) return;
    console.log("Filtrando datos por rango de fechas:", dateRange);
  }, [dateRange]);

  // Función para cargar el historial de semanas desde Supabase
  const loadHistorialSemanas = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      // Obtener todas las entradas del historial semanal
      const { data: historialData, error: historialError } = await supabase
        .from('historial_semanal')
        .select('*')
        .order('fecha_inicio', { ascending: false });
        
      if (historialError) {
        console.error("Error al cargar historial:", historialError);
        throw historialError;
      }
      
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
            
          if (ventasError) {
            console.error("Error al cargar ventas detalle:", ventasError);
            throw ventasError;
          }
          
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
      setErrorMessage(`Error al cargar el historial: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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
      setErrorMessage(null);
      // Verificar si ya existen datos para la semana actual
      const { data: semanaExistente, error: errorBusqueda } = await supabase
        .from('historial_semanal')
        .select('*')
        .eq('semana', currentWeek.displayText)
        .maybeSingle();
        
      if (errorBusqueda && errorBusqueda.code !== 'PGRST116') {
        console.error("Error al buscar semana existente:", errorBusqueda);
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
          
        if (ventasError) {
          console.error("Error al cargar ventas detalle:", ventasError);
          throw ventasError;
        }
        
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
      setErrorMessage(`Error al cargar datos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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
      setErrorMessage(null);
      
      // Verificar si existe una sesión activa de Supabase
      if (!session) {
        throw new Error("No hay sesión activa. Por favor, inicia sesión nuevamente.");
      }
      
      // Verificar si ya existe un registro para esta semana
      const { data: existingSemana, error: searchError } = await supabase
        .from('historial_semanal')
        .select('id')
        .eq('semana', currentWeek.displayText)
        .maybeSingle();
        
      if (searchError) {
        console.error("Error al buscar semana existente:", searchError);
        throw searchError;
      }
      
      // Obtener el usuario actual para registrar quién realiza los cambios
      const storedUser = localStorage.getItem('user');
      const currentUser = storedUser ? JSON.parse(storedUser) : null;
      console.log("Usuario actual realizando guardado:", currentUser);
      
      // Verificar la validez de la sesión antes de continuar
      console.log("Estado de sesión al guardar:", 
        session ? "Activa con token: " + session.access_token.substring(0, 10) + "..." : "No hay sesión"
      );
      
      let historial_id;
      
      if (existingSemana?.id) {
        // Actualizar registro existente
        historial_id = existingSemana.id;
        
        console.log("Actualizando registro existente con ID:", historial_id);
        
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
          
        if (updateError) {
          console.error("Error al actualizar historial:", updateError);
          console.log("Detalles del error:", JSON.stringify(updateError));
          throw updateError;
        } else {
          console.log("Registro actualizado exitosamente");
        }
      } else {
        // Crear nuevo registro
        console.log("Creando nuevo registro de historial semanal");
        
        const insertData = {
          semana: currentWeek.displayText,
          fecha_inicio: currentWeek.startDate.toISOString(),
          fecha_fin: currentWeek.endDate.toISOString(),
          leads_pub_em: leadsData.leads_pub_em,
          leads_pub_cl: leadsData.leads_pub_cl,
          leads_frio_em: leadsData.leads_frio_em,
          leads_frio_cl: leadsData.leads_frio_cl,
          ventas_cerradas: leadsData.ventas_cerradas
        };
        
        console.log("Datos a insertar:", insertData);
        
        const { data: newSemana, error: insertError } = await supabase
          .from('historial_semanal')
          .insert(insertData)
          .select('id')
          .single();
          
        if (insertError) {
          console.error("Error al insertar nuevo historial:", insertError);
          console.log("Detalles del error:", JSON.stringify(insertError));
          throw insertError;
        }
        
        if (!newSemana) {
          console.error("No se recibió ID después de insertar");
          throw new Error("No se recibió ID después de insertar");
        }
        
        console.log("Nuevo registro creado con ID:", newSemana.id);
        historial_id = newSemana.id;
      }
      
      // Eliminar ventas detalle anteriores para esta semana
      if (ventasDetalle.length > 0) {
        console.log("Eliminando ventas detalle existentes para historial_id:", historial_id);
        
        const { error: deleteError } = await supabase
          .from('ventas_detalle')
          .delete()
          .eq('historial_id', historial_id);
          
        if (deleteError) {
          console.error("Error al eliminar ventas detalle:", deleteError);
          console.log("Detalles del error:", JSON.stringify(deleteError));
          throw deleteError;
        } else {
          console.log("Ventas detalle anteriores eliminadas exitosamente");
        }
        
        // Guardar nuevas ventas detalle
        const ventasParaGuardar = ventasDetalle.map(venta => ({
          historial_id,
          cliente: venta.cliente,
          ubicacion: venta.ubicacion,
          tipo_servicio: venta.tipo_servicio,
          costo_unitario: venta.costo_unitario,
          total_vacs: venta.total_vacs
        }));
        
        console.log("Guardando ventas detalle:", ventasParaGuardar);
        
        const { error: insertVentasError } = await supabase
          .from('ventas_detalle')
          .insert(ventasParaGuardar);
          
        if (insertVentasError) {
          console.error("Error al insertar ventas detalle:", insertVentasError);
          console.log("Detalles del error:", JSON.stringify(insertVentasError));
          throw insertVentasError;
        } else {
          console.log("Ventas detalle guardadas exitosamente");
        }
      }
      
      // Recargar el historial
      await loadHistorialSemanas();
      
      toast({
        title: "Éxito",
        description: "Información semanal guardada correctamente"
      });
      
    } catch (error) {
      console.error("Error al guardar datos:", error);
      
      // Si es un error de autenticación, intentar refrescar la sesión
      if (error instanceof Error && 
          (error.message.includes("JWT") || 
           error.message.includes("sesión") || 
           error.message.includes("token"))) {
        
        toast({
          title: "Error de sesión",
          description: "Tu sesión ha expirado. Se intentará reconectar automáticamente.",
          variant: "destructive"
        });
        
        // Esperar un momento y luego refrescar la página
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        
        return;
      }
      
      // Extraer mensaje de error detallado para mostrar al usuario
      let errorDesc = "No se pudo guardar la información semanal";
      
      if (error instanceof Error) {
        errorDesc += `: ${error.message}`;
      } else if (typeof error === 'object' && error !== null) {
        // Si es un error de Supabase probablemente
        const supabaseError = error as any;
        if (supabaseError.message) {
          errorDesc += `: ${supabaseError.message}`;
        }
        if (supabaseError.details) {
          errorDesc += ` (${supabaseError.details})`;
        }
        if (supabaseError.hint) {
          errorDesc += ` - Sugerencia: ${supabaseError.hint}`;
        }
        
        // Verificar si es un error de política RLS
        if (supabaseError.message && supabaseError.message.includes("row-level security policy")) {
          errorDesc = "No tienes permisos para guardar esta información. Por favor, contacta al administrador.";
        }
      }
      
      setErrorMessage(errorDesc);
      
      toast({
        title: "Error",
        description: errorDesc,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  if (authLoading) {
    console.log("[VENTAS_DEBUG] Mostrando pantalla de carga debido a authLoading:", authLoading);
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">TopMarket</h1>
          <p className="text-lg mb-4">Cargando datos de ventas...</p>
          <p className="text-sm text-muted-foreground">Estado de autenticación: {authLoading ? "Cargando..." : "Listo"}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log("[VENTAS_DEBUG] No hay usuario establecido después de cargar");
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">TopMarket</h1>
          <p className="text-lg mb-4">No se pudo cargar la información de usuario</p>
          <Button 
            onClick={() => window.location.href = '/'} 
            className="mt-4"
          >
            Volver al inicio
          </Button>
        </div>
      </div>
    );
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
                
                {errorMessage && (
                  <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
                    <div className="flex">
                      <div className="py-1">
                        <svg className="h-6 w-6 text-red-500 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold">Error</p>
                        <p className="text-sm">{errorMessage}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <Button 
                  className="w-full mt-4 bg-topmarket hover:bg-topmarket/90" 
                  onClick={handleSaveWeekData}
                  disabled={isLoading}
                >
                  {isLoading ? 'Guardando...' : 'Guardar Información Semanal'}
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
