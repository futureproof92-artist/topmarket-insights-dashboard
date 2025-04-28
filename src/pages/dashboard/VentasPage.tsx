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

// Tipo para la semana seleccionada
interface WeekRange {
  startDate: Date;
  endDate: Date;
  displayText: string;
}

// Tipos para leads
interface LeadsData {
  leads_pub_em: number;
  leads_pub_cl: number;
  leads_frio_em: number;
  leads_frio_cl: number;
  ventas_cerradas: number;
}

// Tipos para detalle de ventas
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
  }[]>([{
    semana: 'Lun 21 de Abr 2025 – Vie 25 de Abr 2025',
    leads: {
      leads_pub_em: 15,
      leads_pub_cl: 8,
      leads_frio_em: 12,
      leads_frio_cl: 5,
      ventas_cerradas: 3
    },
    ventasDetalle: [{
      id: '1',
      cliente: 'Empresa ABC',
      ubicacion: 'CDMX',
      tipo_servicio: 'PXR',
      costo_unitario: 5000,
      total_vacs: 2
    }, {
      id: '2',
      cliente: 'Corporativo XYZ',
      ubicacion: 'Monterrey',
      tipo_servicio: 'HH',
      costo_unitario: 7500,
      total_vacs: 1
    }]
  }]);

  const [historialFiltrado, setHistorialFiltrado] = useState<typeof historialSemanas>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      setIsAdmin(parsedUser.role === 'admin' || parsedUser.email?.includes('sergio.t@topmarket.com.mx'));
    }

    updateVentasDetalleRows(leadsData.ventas_cerradas);
  }, []);

  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return;
    
    const semanasMock = [
      {
        semana: 'Lun 21 de Abr 2025 – Vie 25 de Abr 2025',
        leads: {
          leads_pub_em: 15,
          leads_pub_cl: 8,
          leads_frio_em: 12,
          leads_frio_cl: 5,
          ventas_cerradas: 3
        },
        ventasDetalle: [{
          id: '1',
          cliente: 'Empresa ABC',
          ubicacion: 'CDMX',
          tipo_servicio: 'PXR' as const,
          costo_unitario: 5000,
          total_vacs: 2
        }, {
          id: '2',
          cliente: 'Corporativo XYZ',
          ubicacion: 'Monterrey',
          tipo_servicio: 'HH' as const,
          costo_unitario: 7500,
          total_vacs: 1
        }]
      },
      {
        semana: 'Lun 28 de Abr 2025 – Vie 2 de May 2025',
        leads: {
          leads_pub_em: 10,
          leads_pub_cl: 6,
          leads_frio_em: 8,
          leads_frio_cl: 4,
          ventas_cerradas: 2
        },
        ventasDetalle: [{
          id: '3',
          cliente: 'Servicios Globales',
          ubicacion: 'CDMX',
          tipo_servicio: 'OTRO' as const,
          costo_unitario: 6200,
          total_vacs: 1
        }, {
          id: '4',
          cliente: 'Empresa ABC',
          ubicacion: 'CDMX',
          tipo_servicio: 'PXR' as const,
          costo_unitario: 4800,
          total_vacs: 3
        }]
      },
      {
        semana: 'Lun 5 de May 2025 – Vie 9 de May 2025',
        leads: {
          leads_pub_em: 18,
          leads_pub_cl: 9,
          leads_frio_em: 14,
          leads_frio_cl: 7,
          ventas_cerradas: 5
        },
        ventasDetalle: [{
          id: '5',
          cliente: 'TechStart',
          ubicacion: 'Guadalajara',
          tipo_servicio: 'HH' as const,
          costo_unitario: 8000,
          total_vacs: 2
        }, {
          id: '6',
          cliente: 'Innovación Digital',
          ubicacion: 'Monterrey',
          tipo_servicio: 'PXR' as const,
          costo_unitario: 5500,
          total_vacs: 3
        }]
      }
    ];
    
    setHistorialFiltrado(semanasMock);
    
  }, [dateRange]);

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
  };

  const nextWeek = () => {
    const nextWeekStart = addDays(currentWeek.startDate, 7);
    setCurrentWeek(getWeekRange(nextWeekStart));
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

  const handleSaveWeekData = () => {
    console.log('Guardando datos de la semana:', {
      semana: currentWeek.displayText,
      leads: leadsData,
      ventasDetalle
    });

    const existingWeekIndex = historialSemanas.findIndex(item => item.semana === currentWeek.displayText);
    if (existingWeekIndex >= 0) {
      const updatedHistorial = [...historialSemanas];
      updatedHistorial[existingWeekIndex] = {
        semana: currentWeek.displayText,
        leads: {
          ...leadsData
        },
        ventasDetalle: [...ventasDetalle]
      };
      setHistorialSemanas(updatedHistorial);
    } else {
      setHistorialSemanas([...historialSemanas, {
        semana: currentWeek.displayText,
        leads: {
          ...leadsData
        },
        ventasDetalle: [...ventasDetalle]
      }]);
    }

    alert('Datos guardados correctamente');
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
                <VentasResumenAgregado historial={historialFiltrado} dateRange={dateRange} />
              </TabsContent>
              
              <TabsContent value="detalle">
                <HistorialSemanal historial={historialFiltrado} />
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
