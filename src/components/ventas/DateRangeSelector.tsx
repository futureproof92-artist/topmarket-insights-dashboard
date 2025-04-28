
import React, { useState } from 'react';
import { format, addWeeks, startOfWeek, endOfWeek, differenceInDays, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { CalendarRange } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateRangeSelectorProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

export const DateRangeSelector = ({ dateRange, onDateRangeChange }: DateRangeSelectorProps) => {
  // Estado para rastrear qué botón de selección rápida está activo
  const [activeQuickSelection, setActiveQuickSelection] = useState<number | null>(null);
  
  // Función para calcular el texto del rango de fechas seleccionado
  const getDateRangeText = () => {
    if (!dateRange?.from) {
      return "Seleccionar rango de fechas";
    }
    
    if (!dateRange.to) {
      return format(dateRange.from, "d 'de' MMMM yyyy", { locale: es });
    }
    
    // Calcular semanas completas y días adicionales
    const days = differenceInDays(dateRange.to, dateRange.from) + 1;
    const weeks = Math.floor(days / 7);
    const extraDays = days % 7;
    
    let rangeText = `${format(dateRange.from, "d MMM", { locale: es })} - ${format(dateRange.to, "d MMM yyyy", { locale: es })}`;
    
    // Agregar información de semanas y días entre paréntesis
    if (weeks > 0) {
      rangeText += ` (${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
      if (extraDays > 0) {
        rangeText += ` y ${extraDays} ${extraDays === 1 ? 'día' : 'días'}`;
      }
      rangeText += ')';
    } else if (days > 0) {
      rangeText += ` (${days} ${days === 1 ? 'día' : 'días'})`;
    }
    
    return rangeText;
  };

  // Función para manejar selecciones rápidas
  const handleQuickSelection = (weeks: number) => {
    setActiveQuickSelection(weeks);
    const today = new Date();
    const from = startOfWeek(today, { weekStartsOn: 1 });
    const to = endOfWeek(addWeeks(from, weeks - 1), { weekStartsOn: 1 });
    onDateRangeChange({ from, to });
  };

  // Reiniciar el botón activo cuando se selecciona manualmente un rango
  const handleManualSelection = (range: DateRange | undefined) => {
    setActiveQuickSelection(null);
    onDateRangeChange(range);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2 justify-between">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant="outline"
              className="justify-start text-left font-normal h-10"
            >
              <CalendarRange className="mr-2 h-4 w-4" />
              {getDateRangeText()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={handleManualSelection}
              numberOfMonths={2}
              className={cn("p-3 pointer-events-auto")}
              locale={es}
              weekStartsOn={1}
            />
          </PopoverContent>
        </Popover>
        
        <div className="flex gap-2">
          <Button 
            variant={activeQuickSelection === 4 ? "default" : "outline"} 
            size="sm" 
            onClick={() => handleQuickSelection(4)}
          >
            1 Mes
          </Button>
          <Button 
            variant={activeQuickSelection === 8 ? "default" : "outline"} 
            size="sm" 
            onClick={() => handleQuickSelection(8)}
          >
            2 Meses
          </Button>
          <Button 
            variant={activeQuickSelection === 13 ? "default" : "outline"} 
            size="sm" 
            onClick={() => handleQuickSelection(13)}
          >
            3 Meses
          </Button>
        </div>
      </div>
    </div>
  );
};
