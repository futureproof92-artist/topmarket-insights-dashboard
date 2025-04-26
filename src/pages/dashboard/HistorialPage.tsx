
import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { KpiTable } from '@/components/dashboard/KpiTable';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Datos simulados
const mockData: Record<string, any[]> = {
  evelyn: [
    { id: '1', fecha: '2023-04-01', monto: 15000, detalles: 'Venta servicio mensual' },
    { id: '2', fecha: '2023-04-05', monto: 25000, detalles: 'Venta proyecto especial' },
    { id: '3', fecha: '2023-04-10', monto: 18000, detalles: 'Renovación contrato' },
    { id: '4', fecha: '2023-04-15', monto: 3, detalles: 'Prospección nuevos clientes (cantidad)' },
    { id: '5', fecha: '2023-04-20', monto: 5, detalles: 'Reuniones agendadas (cantidad)' },
  ],
  davila: [
    { id: '1', fecha: '2023-04-03', monto: 35000, detalles: 'Proyecto XR para Cliente A' },
    { id: '2', fecha: '2023-04-12', monto: 42000, detalles: 'Implementación XR Cliente B' },
    { id: '3', fecha: '2023-04-18', monto: 28000, detalles: 'Actualización sistema Cliente C' },
  ],
  lilia: [
    { id: '1', fecha: '2023-04-02', monto: 22000, detalles: 'Proyecto HH Cliente X' },
    { id: '2', fecha: '2023-04-09', monto: 18000, detalles: 'Implementación HH Cliente Y' },
    { id: '3', fecha: '2023-04-15', monto: 24000, detalles: 'Mantenimiento HH Cliente Z' },
  ],
  nataly: [
    { id: '1', fecha: '2023-04-05', monto: 45000, detalles: 'Pago Cliente A' },
    { id: '2', fecha: '2023-04-12', monto: 32000, detalles: 'Pago Cliente B' },
    { id: '3', fecha: '2023-04-20', monto: 38000, detalles: 'Pago Cliente C' },
  ],
  admin: [
    { id: '1', fecha: '2023-04-01', monto: 15000, detalles: 'Venta servicio mensual - Evelyn' },
    { id: '2', fecha: '2023-04-03', monto: 35000, detalles: 'Proyecto XR - Davila' },
    { id: '3', fecha: '2023-04-02', monto: 22000, detalles: 'Proyecto HH - Lilia' },
    { id: '4', fecha: '2023-04-05', monto: 45000, detalles: 'Pago Cliente - Nataly' },
    { id: '5', fecha: '2023-04-04', monto: 12000, detalles: 'Gasto TDC1 - Admin' },
  ],
};

const HistorialPage = () => {
  const [user, setUser] = useState<{ role: string; email: string } | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(new Date());
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [filteredData, setFilteredData] = useState<any[]>([]);
  
  useEffect(() => {
    // Obtener el usuario del localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      // Cargar los datos iniciales según el rol
      if (parsedUser.role && mockData[parsedUser.role]) {
        setFilteredData(mockData[parsedUser.role]);
      }
    }
  }, []);

  const handleFilter = () => {
    if (!user?.role || !mockData[user.role]) return;
    
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;
    
    const filtered = mockData[user.role].filter(item => {
      const itemDate = new Date(item.fecha);
      
      if (fromDate && toDate) {
        return itemDate >= fromDate && itemDate <= toDate;
      } else if (fromDate) {
        return itemDate >= fromDate;
      } else if (toDate) {
        return itemDate <= toDate;
      }
      
      return true;
    });
    
    setFilteredData(filtered);
  };

  const handleExportCSV = () => {
    // Implementación básica para exportar a CSV
    const headers = ['Fecha', 'Monto', 'Detalles'];
    
    const csvData = [
      headers.join(','),
      ...filteredData.map(item => 
        [item.fecha, item.monto, `"${item.detalles}"`].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `historial_${user?.role}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (!user) {
    return <div>Cargando...</div>;
  }

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Historial de Registros</h2>
        
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="space-y-2 w-full md:w-auto">
            <Label htmlFor="dateFrom">Desde</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="dateFrom"
                  variant="outline"
                  className="w-full md:w-[200px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "PPP", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2 w-full md:w-auto">
            <Label htmlFor="dateTo">Hasta</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="dateTo"
                  variant="outline"
                  className="w-full md:w-[200px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "PPP", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <Button onClick={handleFilter} className="bg-topmarket hover:bg-topmarket/90 w-full md:w-auto">
            Filtrar
          </Button>
        </div>
        
        <KpiTable 
          data={filteredData} 
          title={`Historial de ${getTitleByRole(user.role)}`}
          onExportCSV={handleExportCSV}
        />
      </div>
    </AppShell>
  );
};

function getTitleByRole(role: string): string {
  switch (role) {
    case 'evelyn':
      return 'Ventas y Prospecciones';
    case 'davila':
      return 'PXR Cerrados';
    case 'lilia':
      return 'HH Cerrados';
    case 'nataly':
      return 'Cobranza';
    case 'admin':
      return 'Todos los Registros';
    default:
      return 'Registros';
  }
}

export default HistorialPage;
