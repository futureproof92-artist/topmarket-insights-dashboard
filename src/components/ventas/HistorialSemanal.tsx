
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardContent
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download, DownloadCloud } from 'lucide-react';
import { DeleteRecordButton } from '@/components/admin/DeleteRecordButton';

import { useAuth } from '@/hooks/use-auth';

interface HistorialSemanalProps {
  historialData?: any[];
  onExportCSV?: () => void;
  currentIndex?: number;
  onPrevPage?: () => void;
  onNextPage?: () => void;
  totalPages?: number;
  onDeleteSuccess?: () => void;
  loading?: boolean;
  onExportSingleWeek?: (id: string) => void;
  // Añadir propiedades que están siendo usadas en VentasPage.tsx
  historial?: any[];
  onDataChange?: () => Promise<void>;
}

export const HistorialSemanal = ({ 
  historialData = [], 
  onExportCSV = () => {}, 
  currentIndex = 0, 
  onPrevPage = () => {}, 
  onNextPage = () => {}, 
  totalPages = 1,
  onDeleteSuccess = () => {},
  loading = false,
  onExportSingleWeek = () => {},
  historial = [],
  onDataChange = async () => {}
}: HistorialSemanalProps) => {
  // Usar historial si está presente, de lo contrario usar historialData
  const dataToDisplay = historial.length > 0 ? historial : historialData;
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between px-6 py-4">
        <div className="flex flex-col space-y-1">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Historial Semanal
          </CardTitle>
          <CardDescription>
            Resumen de leads y ventas por semana
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onExportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-8 text-center">
            <p>Cargando datos...</p>
          </div>
        ) : dataToDisplay.length === 0 ? (
          <div className="p-8 text-center">
            <p>No hay datos para mostrar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Semana</TableHead>
                  <TableHead className="text-right">Leads Pub EM</TableHead>
                  <TableHead className="text-right">Leads Pub CL</TableHead>
                  <TableHead className="text-right">Leads Frio EM</TableHead>
                  <TableHead className="text-right">Leads Frio CL</TableHead>
                  <TableHead className="text-right">Ventas Cerradas</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataToDisplay.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.semana}</TableCell>
                    <TableCell className="text-right">{item.leads?.leads_pub_em || item.leads_pub_em}</TableCell>
                    <TableCell className="text-right">{item.leads?.leads_pub_cl || item.leads_pub_cl}</TableCell>
                    <TableCell className="text-right">{item.leads?.leads_frio_em || item.leads_frio_em}</TableCell>
                    <TableCell className="text-right">{item.leads?.leads_frio_cl || item.leads_frio_cl}</TableCell>
                    <TableCell className="text-right">{item.leads?.ventas_cerradas || item.ventas_cerradas}</TableCell>
                    <TableCell className="text-right">
                      {isAdmin && (
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onExportSingleWeek && onExportSingleWeek(item.id)}
                          >
                            <DownloadCloud className="h-4 w-4" />
                          </Button>
                          <DeleteRecordButton 
                            tableName="historial_semanal"
                            recordId={item.id}
                            onSuccess={() => onDeleteSuccess && onDeleteSuccess()}
                            buttonText="Eliminar"
                            buttonVariant="ghost"
                          />
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="text-sm text-muted-foreground">
            Página {currentIndex + 1} de {totalPages}
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrevPage}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onNextPage}
              disabled={currentIndex === totalPages - 1}
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
