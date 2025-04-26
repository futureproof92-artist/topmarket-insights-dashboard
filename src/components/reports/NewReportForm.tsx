
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface NewReportFormProps {
  userRole: string;
}

export const NewReportForm = ({ userRole }: NewReportFormProps) => {
  const [date, setDate] = useState<Date>(new Date());
  const [amount, setAmount] = useState<string>('');
  const [details, setDetails] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getKpiTypeByRole = (role: string): string => {
    switch (role) {
      case 'evelyn':
        return 'ventas';
      case 'davila':
        return 'pxr_closed';
      case 'lilia':
        return 'hh_closed';
      case 'nataly':
        return 'cobrado';
      default:
        return '';
    }
  };

  const getFormTitle = (role: string): string => {
    switch (role) {
      case 'evelyn':
        return 'Venta';
      case 'davila':
        return 'PXR Cerrado';
      case 'lilia':
        return 'HH Cerrado';
      case 'nataly':
        return 'Monto Cobrado';
      default:
        return 'Reporte';
    }
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

    setIsLoading(true);

    // Simulamos una llamada a la API
    setTimeout(() => {
      console.log({
        fecha: format(date, 'yyyy-MM-dd'),
        usuario: userRole,
        tipo_kpi: getKpiTypeByRole(userRole),
        monto: parseFloat(amount.replace(/,/g, '')),
        detalles: details,
      });

      toast({
        title: "Reporte enviado",
        description: "Tu reporte ha sido guardado correctamente"
      });
      
      setAmount('');
      setDetails('');
      setIsLoading(false);
    }, 1000);
  };

  return (
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
        <Label htmlFor="amount">Monto ({getFormTitle(userRole)})</Label>
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
        <Label htmlFor="details">Detalles</Label>
        <Textarea 
          id="details" 
          value={details} 
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Información adicional sobre este reporte"
        />
      </div>

      <Button type="submit" className="w-full bg-topmarket hover:bg-topmarket/90" disabled={isLoading}>
        {isLoading ? "Enviando..." : "Guardar reporte"}
      </Button>
    </form>
  );
};
