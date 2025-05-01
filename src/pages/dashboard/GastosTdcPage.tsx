
import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { ChartContainer } from '@/components/dashboard/ChartContainer';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { KpiTable } from '@/components/dashboard/KpiTable';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Datos simulados por mes
const mockDataByMonth = {
  '2023-04': {
    plataCard: { total: 45000, gastos: [
      { id: '1', fecha: '2023-04-05', monto: 12000, detalles: 'Pago de servicios' },
      { id: '2', fecha: '2023-04-15', monto: 8000, detalles: 'Materiales oficina' },
    ]},
    hsbc: { total: 38000, gastos: [
      { id: '3', fecha: '2023-04-10', monto: 18000, detalles: 'Campaña marketing' },
      { id: '4', fecha: '2023-04-20', monto: 5000, detalles: 'Comidas clientes' },
    ]},
    access: { total: 25000, gastos: [
      { id: '5', fecha: '2023-04-15', monto: 9000, detalles: 'Viaje a conferencia' },
      { id: '6', fecha: '2023-04-25', monto: 7000, detalles: 'Software licencias' },
    ]},
    simplicity: { total: 18000, gastos: [
      { id: '7', fecha: '2023-04-22', monto: 15000, detalles: 'Material oficina' },
      { id: '8', fecha: '2023-04-28', monto: 3000, detalles: 'Envíos urgentes' },
    ]},
    chartData: [
      { name: 'Semana 1', plataCard: 12000, hsbc: 0, access: 0, simplicity: 0 },
      { name: 'Semana 2', plataCard: 0, hsbc: 18000, access: 9000, simplicity: 0 },
      { name: 'Semana 3', plataCard: 8000, hsbc: 5000, access: 0, simplicity: 15000 },
      { name: 'Semana 4', plataCard: 0, hsbc: 0, access: 7000, simplicity: 3000 },
    ]
  },
  '2023-05': {
    plataCard: { total: 50000, gastos: [
      { id: '9', fecha: '2023-05-05', monto: 15000, detalles: 'Equipo cómputo' },
      { id: '10', fecha: '2023-05-15', monto: 10000, detalles: 'Publicidad' },
    ]},
    hsbc: { total: 42000, gastos: [
      { id: '11', fecha: '2023-05-10', monto: 22000, detalles: 'Renta oficinas' },
      { id: '12', fecha: '2023-05-20', monto: 6000, detalles: 'Papelería' },
    ]},
    access: { total: 28000, gastos: [
      { id: '13', fecha: '2023-05-15', monto: 12000, detalles: 'Capacitación' },
      { id: '14', fecha: '2023-05-25', monto: 8000, detalles: 'Mantenimiento' },
    ]},
    simplicity: { total: 22000, gastos: [
      { id: '15', fecha: '2023-05-18', monto: 18000, detalles: 'Mobiliario' },
      { id: '16', fecha: '2023-05-28', monto: 4000, detalles: 'Mensajería' },
    ]},
    chartData: [
      { name: 'Semana 1', plataCard: 15000, hsbc: 0, access: 0, simplicity: 0 },
      { name: 'Semana 2', plataCard: 0, hsbc: 22000, access: 12000, simplicity: 0 },
      { name: 'Semana 3', plataCard: 10000, hsbc: 6000, access: 0, simplicity: 18000 },
      { name: 'Semana 4', plataCard: 0, hsbc: 0, access: 8000, simplicity: 4000 },
    ]
  }
};

// Tarjetas
const tarjetas = [
  { id: 'plataCard', nombre: 'PLATA CARD', color: '#0045FF' },
  { id: 'hsbc', nombre: 'HSBC', color: '#22C55E' },
  { id: 'access', nombre: 'ACCESS', color: '#EAB308' },
  { id: 'simplicity', nombre: 'SIMPLICITY', color: '#EC4899' },
];

const GastosTdcPage = () => {
  const [user, setUser] = useState<{ role: string; email: string } | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [date, setDate] = useState<Date>(new Date());
  const [amount, setAmount] = useState<string>('');
  const [tarjeta, setTarjeta] = useState<string>('');
  const [concepto, setConcepto] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // New state for inline editing
  const [inlineEditing, setInlineEditing] = useState<string | null>(null);
  const [inlineAmount, setInlineAmount] = useState<string>('');
  const [inlineConcepto, setInlineConcepto] = useState<string>('');
  
  // Formato de mes para acceder a los datos
  const monthFormat = format(selectedMonth, 'yyyy-MM');
  const monthData = mockDataByMonth[monthFormat as keyof typeof mockDataByMonth] || 
    mockDataByMonth['2023-04']; // Fallback al primer mes si no hay datos
  
  useEffect(() => {
    // Obtener el usuario del localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setSelectedMonth(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || isNaN(parseFloat(amount))) {
      toast({
        title: "Error",
        description: "Por favor ingresa un monto válido",
        variant: "destructive",
      });
      return;
    }

    if (!tarjeta) {
      toast({
        title: "Error",
        description: "Por favor selecciona una tarjeta",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simulamos una llamada a la API
    setTimeout(() => {
      console.log({
        fecha: format(date, 'yyyy-MM-dd'),
        tarjeta,
        monto: parseFloat(amount.replace(/,/g, '')),
        concepto,
      });

      toast({
        title: "Gasto registrado",
        description: "El gasto ha sido registrado correctamente"
      });
      
      setAmount('');
      setTarjeta('');
      setConcepto('');
      setIsLoading(false);
    }, 1000);
  };

  // Handler for submitting inline expense addition
  const handleInlineSubmit = (tarjetaId: string) => {
    if (!inlineAmount || isNaN(parseFloat(inlineAmount))) {
      toast({
        title: "Error",
        description: "Por favor ingresa un monto válido",
        variant: "destructive",
      });
      return;
    }

    // Simulate API call
    setTimeout(() => {
      console.log({
        fecha: format(new Date(), 'yyyy-MM-dd'),
        tarjeta: tarjetaId,
        monto: parseFloat(inlineAmount.replace(/,/g, '')),
        concepto: inlineConcepto,
      });

      toast({
        title: "Gasto registrado",
        description: "El gasto ha sido registrado correctamente"
      });
      
      setInlineEditing(null);
      setInlineAmount('');
      setInlineConcepto('');
    }, 500);
  };

  // Start inline editing for a specific card
  const startInlineEditing = (tarjetaId: string) => {
    setInlineEditing(tarjetaId);
    setInlineAmount('');
    setInlineConcepto('');
  };

  // Cancel inline editing
  const cancelInlineEditing = () => {
    setInlineEditing(null);
    setInlineAmount('');
    setInlineConcepto('');
  };

  // Calcular total de gastos
  const totalGastos = tarjetas.reduce((total, tarjetaItem) => {
    return total + (monthData[tarjetaItem.id as keyof typeof monthData] as any)?.total || 0;
  }, 0);
  
  if (!user) {
    return <div>Cargando...</div>;
  }

  if (user.role !== 'admin') {
    return <div className="text-center p-8">No tienes permiso para acceder a esta página.</div>;
  }

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Gastos TDC</h2>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-topmarket hover:bg-topmarket/90">
                <PlusIcon className="mr-2 h-4 w-4" /> Nuevo Gasto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Registrar Gasto</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Fecha</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP", { locale: es }) : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(date) => date && setDate(date)}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tarjeta">Tarjeta</Label>
                  <Select value={tarjeta} onValueChange={setTarjeta}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tarjeta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plataCard">PLATA CARD</SelectItem>
                      <SelectItem value="hsbc">HSBC</SelectItem>
                      <SelectItem value="access">ACCESS</SelectItem>
                      <SelectItem value="simplicity">SIMPLICITY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Monto</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                    <Input 
                      id="amount" 
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-7" 
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="concepto">Concepto</Label>
                  <Textarea 
                    id="concepto" 
                    value={concepto} 
                    onChange={(e) => setConcepto(e.target.value)}
                    placeholder="Descripción del gasto"
                  />
                </div>

                <Button type="submit" className="w-full bg-topmarket hover:bg-topmarket/90" disabled={isLoading}>
                  {isLoading ? "Enviando..." : "Guardar gasto"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Selector de mes */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleMonthChange('prev')}
          >
            &lt; Mes anterior
          </Button>
          <h3 className="text-lg font-medium">
            {format(selectedMonth, 'MMMM yyyy', { locale: es })}
          </h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleMonthChange('next')}
          >
            Mes siguiente &gt;
          </Button>
        </div>
        
        <DashboardCard
          title="Total Gastos TDC"
          value={`$${totalGastos.toLocaleString('es-MX')}`}
          description={`Total para ${format(selectedMonth, 'MMMM yyyy', { locale: es })}`}
          trend={{ value: 8, isPositive: false }}
          className="w-full md:w-1/2"
        />
        
        {/* Vista de 4 columnas con las tarjetas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {tarjetas.map((tarjetaItem) => {
            const tarjetaData = monthData[tarjetaItem.id as keyof typeof monthData] as any;
            const isEditingThisCard = inlineEditing === tarjetaItem.id;
            
            return (
              <Card key={tarjetaItem.id} className="overflow-hidden">
                <CardHeader className="p-4" style={{ backgroundColor: tarjetaItem.color }}>
                  <CardTitle className="text-white text-center">{tarjetaItem.nombre}</CardTitle>
                  <p className="text-white text-center text-xl font-bold">
                    ${tarjetaData?.total?.toLocaleString('es-MX') || '0'}
                  </p>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/2 py-2">MONTO</TableHead>
                        <TableHead className="w-1/2 py-2">CONCEPTO</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tarjetaData?.gastos?.length > 0 ? (
                        tarjetaData.gastos.map((gasto: any) => (
                          <TableRow key={gasto.id}>
                            <TableCell className="py-2">${gasto.monto.toLocaleString('es-MX')}</TableCell>
                            <TableCell className="py-2">{gasto.detalles}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-4">No hay gastos registrados</TableCell>
                        </TableRow>
                      )}
                      
                      {/* Inline editing row */}
                      {isEditingThisCard && (
                        <TableRow>
                          <TableCell className="py-2 px-2">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                              <Input 
                                value={inlineAmount} 
                                onChange={(e) => setInlineAmount(e.target.value)}
                                className="pl-7" 
                                placeholder="0.00"
                                autoFocus
                              />
                            </div>
                          </TableCell>
                          <TableCell className="py-2 px-2">
                            <div className="flex space-x-2">
                              <Input 
                                value={inlineConcepto} 
                                onChange={(e) => setInlineConcepto(e.target.value)}
                                placeholder="Descripción"
                                className="flex-grow"
                              />
                              <Button 
                                size="sm" 
                                className="bg-green-500 hover:bg-green-600 text-white"
                                onClick={() => handleInlineSubmit(tarjetaItem.id)}
                              >
                                ✓
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={cancelInlineEditing}
                              >
                                ✕
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}

                      {/* "Add expense" button row */}
                      {!isEditingThisCard && (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="w-full text-gray-400 hover:text-gray-600"
                              onClick={() => startInlineEditing(tarjetaItem.id)}
                            >
                              <PlusIcon className="h-4 w-4 mr-1" /> Agregar gasto
                            </Button>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <ChartContainer
          title={`Gastos por Tarjeta (${format(selectedMonth, 'MMMM yyyy', { locale: es })})`}
          data={monthData.chartData}
          series={tarjetas.map(t => ({ name: t.nombre, dataKey: t.id, color: t.color }))}
          type="bar"
        />
      </div>
    </AppShell>
  );
};

export default GastosTdcPage;
