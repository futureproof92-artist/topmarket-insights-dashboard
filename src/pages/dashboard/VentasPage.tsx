
import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { addDays, startOfWeek, format, getDay, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { LeadsForm } from '@/components/ventas/LeadsForm';
import { VentasDetalleForm } from '@/components/ventas/VentasDetalleForm';
import { HistorialSemanal } from '@/components/ventas/HistorialSemanal';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [user, setUser] = useState<{ role: string; email: string } | null>(null);
  const [currentWeek, setCurrentWeek] = useState<WeekRange>(() => {
    // Iniciar con la semana actual
    const now = new Date();
    return getWeekRange(now);
  });
  
  // Datos de leads para la semana actual
  const [leadsData, setLeadsData] = useState<LeadsData>({
    leads_pub_em: 0,
    leads_pub_cl: 0,
    leads_frio_em: 0,
    leads_frio_cl: 0,
    ventas_cerradas: 0
  });

  // Detalle de ventas para la semana actual
  const [ventasDetalle, setVentasDetalle] = useState<VentaDetalle[]>([]);
  
  // Historial mockup - en una implementación real esto vendría de backend
  const [historialSemanas, setHistorialSemanas] = useState<{
    semana: string;
    leads: LeadsData;
    ventasDetalle: VentaDetalle[];
  }[]>([
    {
      semana: 'Lun 21 de Abr 2025 – Vie 25 de Abr 2025',
      leads: {
        leads_pub_em: 15,
        leads_pub_cl: 8,
        leads_frio_em: 12,
        leads_frio_cl: 5,
        ventas_cerradas: 3
      },
      ventasDetalle: [
        {
          id: '1',
          cliente: 'Empresa ABC',
          ubicacion: 'CDMX',
          tipo_servicio: 'PXR',
          costo_unitario: 5000,
          total_vacs: 2
        },
        {
          id: '2',
          cliente: 'Corporativo XYZ',
          ubicacion: 'Monterrey',
          tipo_servicio: 'HH',
          costo_unitario: 7500,
          total_vacs: 1
        },
        {
          id: '3',
          cliente: 'Grupo Innovación',
          ubicacion: 'Guadalajara',
          tipo_servicio: 'OTRO',
          costo_unitario: 4800,
          total_vacs: 3
        }
      ]
    }
  ]);
  
  useEffect(() => {
    // Obtener el usuario del localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    // Actualizar ventasDetalle basado en el número de ventas_cerradas
    updateVentasDetalleRows(leadsData.ventas_cerradas);
  }, []);

  // Función para calcular el rango de semana a partir de una fecha
  function getWeekRange(date: Date): WeekRange {
    // Ajustar para que la semana comience el lunes
    const startDate = startOfWeek(date, { weekStartsOn: 1 });
    const endDate = addDays(startDate, 4); // Viernes (4 días después del lunes)

    // Formatear el texto de visualización
    const displayText = `Lun ${format(startDate, "d 'de' MMM yyyy", { locale: es })} – Vie ${format(endDate, "d 'de' MMM yyyy", { locale: es })}`;

    return { startDate, endDate, displayText };
  }

  // Función para mover a la semana anterior
  const prevWeek = () => {
    const prevWeekStart = addDays(currentWeek.startDate, -7);
    setCurrentWeek(getWeekRange(prevWeekStart));
  };

  // Función para mover a la semana siguiente
  const nextWeek = () => {
    const nextWeekStart = addDays(currentWeek.startDate, 7);
    setCurrentWeek(getWeekRange(nextWeekStart));
  };

  // Actualizar las filas de detalle de ventas basado en ventas_cerradas
  const updateVentasDetalleRows = (ventasCerradas: number) => {
    const currentLength = ventasDetalle.length;
    
    if (ventasCerradas > currentLength) {
      // Añadir filas nuevas
      const newRows = Array.from({ length: ventasCerradas - currentLength }, (_, i) => ({
        id: `new-${Date.now()}-${i}`,
        cliente: '',
        ubicacion: '',
        tipo_servicio: 'PXR' as 'PXR' | 'HH' | 'OTRO',
        costo_unitario: 0,
        total_vacs: 1
      }));
      
      setVentasDetalle([...ventasDetalle, ...newRows]);
    } else if (ventasCerradas < currentLength) {
      // Eliminar filas excedentes
      setVentasDetalle(ventasDetalle.slice(0, ventasCerradas));
    }
  };

  // Manejar cambios en los datos de leads
  const handleLeadsChange = (newLeadsData: LeadsData) => {
    setLeadsData(newLeadsData);
    updateVentasDetalleRows(newLeadsData.ventas_cerradas);
  };

  // Manejar cambios en detalle de ventas
  const handleVentaDetalleChange = (index: number, field: keyof VentaDetalle, value: any) => {
    const updatedVentas = [...ventasDetalle];
    updatedVentas[index] = {
      ...updatedVentas[index],
      [field]: value
    };
    setVentasDetalle(updatedVentas);
  };

  // Guardar datos de la semana
  const handleSaveWeekData = () => {
    // Aquí se implementaría la lógica para guardar en backend
    console.log('Guardando datos de la semana:', {
      semana: currentWeek.displayText,
      leads: leadsData,
      ventasDetalle
    });
    
    // Mock para simular actualización de historial
    const existingWeekIndex = historialSemanas.findIndex(item => item.semana === currentWeek.displayText);
    
    if (existingWeekIndex >= 0) {
      // Actualizar semana existente
      const updatedHistorial = [...historialSemanas];
      updatedHistorial[existingWeekIndex] = {
        semana: currentWeek.displayText,
        leads: { ...leadsData },
        ventasDetalle: [...ventasDetalle]
      };
      setHistorialSemanas(updatedHistorial);
    } else {
      // Añadir nueva semana al historial
      setHistorialSemanas([
        ...historialSemanas,
        {
          semana: currentWeek.displayText,
          leads: { ...leadsData },
          ventasDetalle: [...ventasDetalle]
        }
      ]);
    }

    // Mostrar notificación de éxito (en una implementación real)
    alert('Datos guardados correctamente');
  };

  if (!user) {
    return <div>Cargando...</div>;
  }

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        {/* Selector de Semana */}
        <div className="flex items-center justify-between border p-4 rounded-md bg-white">
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
            {/* Formulario de Leads */}
            <LeadsForm 
              leadsData={leadsData} 
              onLeadsChange={handleLeadsChange} 
            />
            
            {/* Formulario de Detalle de Ventas */}
            {leadsData.ventas_cerradas > 0 && (
              <VentasDetalleForm 
                ventasDetalle={ventasDetalle} 
                onVentaDetalleChange={handleVentaDetalleChange}
              />
            )}
            
            {/* Botón de guardar */}
            <Button 
              className="w-full mt-4 bg-topmarket hover:bg-topmarket/90" 
              onClick={handleSaveWeekData}
            >
              Guardar Información Semanal
            </Button>
          </TabsContent>
          
          <TabsContent value="historial">
            <HistorialSemanal historial={historialSemanas} />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
};

export default VentasPage;
