
import React from 'react';
import { VentaDetalle } from '@/pages/dashboard/VentasPage';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface VentasDetalleFormProps {
  ventasDetalle: VentaDetalle[];
  onVentaDetalleChange: (index: number, field: keyof VentaDetalle, value: any) => void;
}

export const VentasDetalleForm = ({ ventasDetalle, onVentaDetalleChange }: VentasDetalleFormProps) => {
  // Calculate statistics
  const clientCount = new Set(ventasDetalle.map(v => v.cliente).filter(c => c.trim() !== '')).size;
  const avgCost = ventasDetalle.length > 0 && ventasDetalle.some(v => v.costo_unitario > 0)
    ? ventasDetalle.reduce((sum, v) => sum + v.costo_unitario, 0) / 
      ventasDetalle.filter(v => v.costo_unitario > 0).length
    : 0;
  const totalVacancies = ventasDetalle.reduce((sum, v) => sum + v.total_vacs, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalle de Ventas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre Cliente</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Tipo Servicio</TableHead>
                <TableHead>Costo Unitario</TableHead>
                <TableHead>Total de Vacantes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ventasDetalle.map((venta, index) => (
                <TableRow key={venta.id}>
                  <TableCell>
                    <Input 
                      value={venta.cliente}
                      onChange={(e) => onVentaDetalleChange(index, 'cliente', e.target.value)}
                      placeholder="Nombre del cliente"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      value={venta.ubicacion}
                      onChange={(e) => onVentaDetalleChange(index, 'ubicacion', e.target.value)}
                      placeholder="Ubicación"
                    />
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={venta.tipo_servicio}
                      onValueChange={(value) => onVentaDetalleChange(index, 'tipo_servicio', value as 'PXR' | 'HH' | 'OTRO')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PXR">PXR</SelectItem>
                        <SelectItem value="HH">HH</SelectItem>
                        <SelectItem value="OTRO">OTRO</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                      <Input 
                        type="number"
                        min="1"
                        value={venta.costo_unitario}
                        onChange={(e) => {
                          const value = Math.max(0, parseFloat(e.target.value) || 0);
                          onVentaDetalleChange(index, 'costo_unitario', value);
                        }}
                        className="pl-7"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number"
                      min="1"
                      value={venta.total_vacs}
                      onChange={(e) => {
                        const value = Math.max(1, parseInt(e.target.value) || 1);
                        onVentaDetalleChange(index, 'total_vacs', value);
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/20">
                <TableCell className="font-medium">
                  Contar clientes: {clientCount}
                </TableCell>
                <TableCell colSpan={2}></TableCell>
                <TableCell className="font-medium">
                  Promedio costo: ${avgCost.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </TableCell>
                <TableCell className="font-medium">
                  Sumar vacantes: {totalVacancies}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
