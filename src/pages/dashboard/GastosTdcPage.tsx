
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
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { KpiTable } from '@/components/dashboard/KpiTable';
import { useToast } from '@/hooks/use-toast';

// Datos simulados
const mockData = {
  tdc1: 45000,
  tdc2: 38000,
  tdc3: 25000,
  tdc4: 18000,
  
  chartData: [
    { name: 'Ene', tdc1: 40000, tdc2: 35000, tdc3: 20000, tdc4: 15000 },
    { name: 'Feb', tdc1: 42000, tdc2: 36000, tdc3: 22000, tdc4: 16000 },
    { name: 'Mar', tdc1: 43000, tdc2: 37000, tdc3: 23000, tdc4: 17000 },
    { name: 'Abr', tdc1: 45000, tdc2: 38000, tdc3: 25000, tdc4: 18000 },
  ],
  
  gastos: [
    { id: '1', fecha: '2023-04-04', monto: 12000, detalles: 'Pago de servicios', tarjeta: 'tdc1' },
    { id: '2', fecha: '2023-04-10', monto: 18000, detalles: 'Campaña marketing', tarjeta: 'tdc2' },
    { id: '3', fecha: '2023-04-15', monto: 9000, detalles: 'Viaje a conferencia', tarjeta: 'tdc3' },
    { id: '4', fecha: '2023-04-22', monto: 15000, detalles: 'Material oficina', tarjeta: 'tdc4' },
  ],
};

const GastosTdcPage = () => {
  const [user, setUser] = useState<{ role: string; email: string } | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [amount, setAmount] = useState<string>('');
  const [tarjeta, setTarjeta] = useState<string>('');
  const [concepto, setConcepto] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    // Obtener el usuario del localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

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

  const totalGastos = mockData.tdc1 + mockData.tdc2 + mockData.tdc3 + mockData.tdc4;
  
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
                      <SelectItem value="tdc1">TDC 1</SelectItem>
                      <SelectItem value="tdc2">TDC 2</SelectItem>
                      <SelectItem value="tdc3">TDC 3</SelectItem>
                      <SelectItem value="tdc4">TDC 4</SelectItem>
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
        
        <DashboardCard
          title="Total Gastos TDC"
          value={`$${totalGastos.toLocaleString('es-MX')}`}
          description="Suma de gastos en todas las tarjetas"
          trend={{ value: 8, isPositive: false }}
          className="w-full md:w-1/2"
        />
        
        <div className="grid gap-4 md:grid-cols-4">
          <DashboardCard title="TDC 1" value={`$${mockData.tdc1.toLocaleString('es-MX')}`} />
          <DashboardCard title="TDC 2" value={`$${mockData.tdc2.toLocaleString('es-MX')}`} />
          <DashboardCard title="TDC 3" value={`$${mockData.tdc3.toLocaleString('es-MX')}`} />
          <DashboardCard title="TDC 4" value={`$${mockData.tdc4.toLocaleString('es-MX')}`} />
        </div>
        
        <ChartContainer
          title="Gastos por Tarjeta (Mensual)"
          data={mockData.chartData}
          series={[
            { name: 'TDC 1', dataKey: 'tdc1', color: '#0045FF' },
            { name: 'TDC 2', dataKey: 'tdc2', color: '#22C55E' },
            { name: 'TDC 3', dataKey: 'tdc3', color: '#EAB308' },
            { name: 'TDC 4', dataKey: 'tdc4', color: '#EC4899' },
          ]}
          type="bar"
        />
        
        <KpiTable 
          data={mockData.gastos} 
          title="Historial de Gastos" 
          onExportCSV={() => console.log('Export CSV Gastos')}
        />
      </div>
    </AppShell>
  );
};

export default GastosTdcPage;
