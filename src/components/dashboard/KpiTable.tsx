
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface KpiRecord {
  id: string;
  fecha: string;
  monto: number;
  detalles?: string;
}

interface KpiTableProps {
  data: KpiRecord[];
  title?: string;
  loading?: boolean;
  onExportCSV?: () => void;
}

export const KpiTable = ({ data, title, loading, onExportCSV }: KpiTableProps) => {
  return (
    <div className="space-y-4">
      {title && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">{title}</h3>
          {onExportCSV && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onExportCSV}
            >
              Exportar CSV
            </Button>
          )}
        </div>
      )}
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead className="hidden md:table-cell">Detalles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">Cargando datos...</TableCell>
              </TableRow>
            ) : data.length > 0 ? (
              data.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.fecha}</TableCell>
                  <TableCell>${record.monto.toLocaleString('es-MX')}</TableCell>
                  <TableCell className="hidden md:table-cell">{record.detalles || '-'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">No hay registros disponibles</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
