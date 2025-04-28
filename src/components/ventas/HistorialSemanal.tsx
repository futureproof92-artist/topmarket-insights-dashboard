
import React, { useState } from 'react';
import { VentaDetalle } from '@/pages/dashboard/VentasPage';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from '@/components/ui/card';

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

interface HistorialSemanalProps {
  historial: HistorialItem[];
}

export const HistorialSemanal = ({ historial }: HistorialSemanalProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Historial de Reportes Semanales</h2>
      
      {historial.length > 0 ? (
        <Accordion type="single" collapsible className="w-full">
          {historial.map((item, index) => (
            <AccordionItem 
              key={`semana-${index}`} 
              value={`semana-${index}`}
              className="border rounded-lg mb-4 overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-2 hover:bg-muted/50">
                <div className="flex flex-col sm:flex-row justify-between w-full items-start sm:items-center">
                  <span className="font-medium">{item.semana}</span>
                  <span className="text-muted-foreground text-sm">
                    {item.ventasDetalle.length} ventas | {item.leads.leads_pub_em + item.leads.leads_pub_cl + item.leads.leads_frio_em + item.leads.leads_frio_cl} leads totales
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="p-4 space-y-6">
                  {/* Resumen de Leads */}
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="font-semibold mb-4">Resumen de Leads</h3>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                          <p className="text-muted-foreground text-sm">LEADS PUB EM</p>
                          <p className="text-lg font-medium">{item.leads.leads_pub_em}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-sm">LEADS PUB CL</p>
                          <p className="text-lg font-medium">{item.leads.leads_pub_cl}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-sm">LEADS FRIO EM</p>
                          <p className="text-lg font-medium">{item.leads.leads_frio_em}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-sm">LEADS FRIO CL</p>
                          <p className="text-lg font-medium">{item.leads.leads_frio_cl}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-sm">VENTAS CERRADAS</p>
                          <p className="text-lg font-medium">{item.leads.ventas_cerradas}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Tabla de Ventas Detalle */}
                  {item.ventasDetalle.length > 0 && (
                    <div className="overflow-x-auto">
                      <h3 className="font-semibold mb-4">Detalle de Ventas</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nombre Cliente</TableHead>
                            <TableHead>Ubicación</TableHead>
                            <TableHead>Tipo Servicio</TableHead>
                            <TableHead>Costo Unitario</TableHead>
                            <TableHead>Total Vacantes</TableHead>
                            <TableHead>Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {item.ventasDetalle.map((venta) => (
                            <TableRow key={venta.id}>
                              <TableCell>{venta.cliente}</TableCell>
                              <TableCell>{venta.ubicacion}</TableCell>
                              <TableCell>{venta.tipo_servicio}</TableCell>
                              <TableCell>${venta.costo_unitario.toLocaleString('es-MX')}</TableCell>
                              <TableCell>{venta.total_vacs}</TableCell>
                              <TableCell className="font-medium">
                                ${(venta.costo_unitario * venta.total_vacs).toLocaleString('es-MX')}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/20">
                            <TableCell colSpan={5} className="text-right font-medium">Total Ventas:</TableCell>
                            <TableCell className="font-medium">
                              ${item.ventasDetalle.reduce((sum, venta) => 
                                sum + (venta.costo_unitario * venta.total_vacs), 0).toLocaleString('es-MX')}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="text-center py-12 bg-muted rounded-lg">
          <p className="text-muted-foreground">No hay registros históricos disponibles</p>
        </div>
      )}
    </div>
  );
};
