import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { VentaDetalle } from '@/pages/dashboard/VentasPage';
import { format, differenceInDays, parseISO, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

interface LeadsData {
  leads_pub_em: number;
  leads_pub_cl: number;
  leads_frio_em: number;
  leads_frio_cl: number;
  ventas_cerradas: number;
}

interface HistorialItem {
  semana: string;
  leads: LeadsData;
  ventasDetalle: VentaDetalle[];
}

interface VentasResumenAgregadoProps {
  historial: HistorialItem[];
  dateRange?: DateRange; // Updated to use DateRange from react-day-picker
}

export const VentasResumenAgregado = ({
  historial,
  dateRange
}: VentasResumenAgregadoProps) => {
  // Calcular periodo seleccionado
  const periodoSeleccionado = useMemo(() => {
    if (!dateRange?.from) {
      return `${historial.length} semanas seleccionadas`;
    }

    // If to is not defined, use from as the end date for calculations
    const endDate = dateRange.to || dateRange.from;
    const days = differenceInDays(endDate, dateRange.from) + 1;
    const totalWeeks = Math.ceil(days / 7);
    if (totalWeeks <= 4) {
      return `${totalWeeks} ${totalWeeks === 1 ? 'semana' : 'semanas'} seleccionadas`;
    } else if (totalWeeks <= 8) {
      return `Aproximadamente 2 meses seleccionados`;
    } else if (totalWeeks <= 13) {
      return `Aproximadamente 3 meses seleccionados`;
    } else {
      return `${format(dateRange.from, "d MMM yyyy", {
        locale: es
      })} al ${format(endDate, "d MMM yyyy", {
        locale: es
      })}`;
    }
  }, [dateRange, historial.length]);

  // Calcular datos agregados usando useMemo para evitar recálculos innecesarios
  const datosAgregados = useMemo(() => {
    if (!historial.length) return null;

    // Inicializar acumuladores
    const totalLeads = {
      leads_pub_em: 0,
      leads_pub_cl: 0,
      leads_frio_em: 0,
      leads_frio_cl: 0,
      ventas_cerradas: 0
    };

    // Acumular todas las ventas
    const todasLasVentas: VentaDetalle[] = [];

    // Logging para depuración
    console.log("Filtrando datos por rango de fecha:", dateRange);
    console.log("Datos históricos disponibles:", historial.length, "semanas");
    
    historial.forEach(item => {
      // Sumar leads
      totalLeads.leads_pub_em += item.leads.leads_pub_em;
      totalLeads.leads_pub_cl += item.leads.leads_pub_cl;
      totalLeads.leads_frio_em += item.leads.leads_frio_em;
      totalLeads.leads_frio_cl += item.leads.leads_frio_cl;
      totalLeads.ventas_cerradas += item.leads.ventas_cerradas;

      // Añadir ventas detalle
      todasLasVentas.push(...item.ventasDetalle);
    });

    // Calcular totales por cliente
    const ventasPorCliente: Record<string, {
      cliente: string;
      ubicacion: string;
      totalServiciosPXR: number;
      totalServiciosHH: number;
      totalServiciosOTRO: number;
      totalVacantes: number;
      montoTotal: number;
      costoUnitario: number; // Para calcular el promedio de costo unitario por cliente
      totalServicios: number; // Para ayudar a calcular el promedio
    }> = {};
    
    todasLasVentas.forEach(venta => {
      if (!ventasPorCliente[venta.cliente]) {
        ventasPorCliente[venta.cliente] = {
          cliente: venta.cliente,
          ubicacion: venta.ubicacion,
          totalServiciosPXR: 0,
          totalServiciosHH: 0,
          totalServiciosOTRO: 0,
          totalVacantes: 0,
          montoTotal: 0,
          costoUnitario: 0,
          totalServicios: 0
        };
      }

      // Incrementar contadores según tipo de servicio
      if (venta.tipo_servicio === 'PXR') {
        ventasPorCliente[venta.cliente].totalServiciosPXR += 1;
      } else if (venta.tipo_servicio === 'HH') {
        ventasPorCliente[venta.cliente].totalServiciosHH += 1;
      } else {
        ventasPorCliente[venta.cliente].totalServiciosOTRO += 1;
      }
      
      ventasPorCliente[venta.cliente].totalVacantes += venta.total_vacs;
      ventasPorCliente[venta.cliente].montoTotal += venta.costo_unitario * venta.total_vacs;
      ventasPorCliente[venta.cliente].costoUnitario += venta.costo_unitario;
      ventasPorCliente[venta.cliente].totalServicios += 1;
    });
    
    // Calcular el promedio de costo unitario para cada cliente
    Object.values(ventasPorCliente).forEach(cliente => {
      if (cliente.totalServicios > 0) {
        cliente.costoUnitario = cliente.costoUnitario / cliente.totalServicios;
      }
    });

    // Calculate global statistics
    const clientCount = Object.keys(ventasPorCliente).length;
    const avgCost = todasLasVentas.length > 0 
      ? todasLasVentas.reduce((sum, v) => sum + v.costo_unitario, 0) / todasLasVentas.length
      : 0;
    const totalVacancies = todasLasVentas.reduce((sum, v) => sum + v.total_vacs, 0);
    
    return {
      totalLeads,
      ventasPorCliente: Object.values(ventasPorCliente),
      periodoSeleccionado,
      clientCount,
      avgCost,
      totalVacancies,
      totalVentas: todasLasVentas.reduce((sum, venta) => sum + venta.costo_unitario * venta.total_vacs, 0)
    };
  }, [historial, periodoSeleccionado]);

  if (!datosAgregados) {
    return <div className="text-center py-12 bg-muted rounded-lg">
        <p className="text-muted-foreground">No hay datos disponibles para el período seleccionado</p>
      </div>;
  }

  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Resumen Agregado</h2>
        <span className="text-sm text-muted-foreground">{datosAgregados.periodoSeleccionado}</span>
      </div>

      {/* Resumen de Leads */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Leads Totales</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-muted-foreground text-sm">LEADS PUB EM</p>
              <p className="text-lg font-medium">{datosAgregados.totalLeads.leads_pub_em}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">LEADS PUB CL</p>
              <p className="text-lg font-medium">{datosAgregados.totalLeads.leads_pub_cl}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">LEADS FRIO EM</p>
              <p className="text-lg font-medium">{datosAgregados.totalLeads.leads_frio_em}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">LEADS FRIO CL</p>
              <p className="text-lg font-medium">{datosAgregados.totalLeads.leads_frio_cl}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">VENTAS CERRADAS</p>
              <p className="text-lg font-medium">{datosAgregados.totalLeads.ventas_cerradas}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Ventas por Cliente */}
      {datosAgregados.ventasPorCliente.length > 0 && <div className="overflow-x-auto">
          <h3 className="font-semibold mb-4">Resumen de Ventas por Cliente</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Total PXR</TableHead>
                <TableHead>Total HH</TableHead>
                <TableHead>Total Otros</TableHead>
                <TableHead>Costo Unitario</TableHead>
                <TableHead>Total Vacantes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datosAgregados.ventasPorCliente.map((cliente, idx) => <TableRow key={`${cliente.cliente}-${idx}`}>
                  <TableCell className="font-medium">{cliente.cliente}</TableCell>
                  <TableCell>{cliente.ubicacion}</TableCell>
                  <TableCell>{cliente.totalServiciosPXR}</TableCell>
                  <TableCell>{cliente.totalServiciosHH}</TableCell>
                  <TableCell>{cliente.totalServiciosOTRO}</TableCell>
                  <TableCell>${cliente.costoUnitario.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                  <TableCell>{cliente.totalVacantes}</TableCell>
                </TableRow>)}
              <TableRow className="bg-muted/20">
                <TableCell className="font-medium">
                  Contar clientes: {datosAgregados.clientCount}
                </TableCell>
                <TableCell colSpan={3}></TableCell>
                <TableCell className="font-medium">
                  Promedio costo: ${datosAgregados.avgCost.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </TableCell>
                <TableCell className="font-medium text-right" colSpan={2}>
                  Sumar vacantes: {datosAgregados.totalVacancies}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>}
    </div>;
};
