
import React from 'react';
import { format, addWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateRangeSelectorProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

export const DateRangeSelector = ({ dateRange, onDateRangeChange }: DateRangeSelectorProps) => {
  // Función para manejar selecciones rápidas
  const handleQuickSelection = (weeks: number) => {
    const today = new Date();
    const from = startOfWeek(new Date(), { weekStartsOn: 1 });
    const to = endOfWeek(addWeeks(from, weeks - 1), { weekStartsOn: 1 });
    onDateRangeChange({ from, to });
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
              <CalendarDays className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "d MMM", { locale: es })} - {format(dateRange.to, "d MMM yyyy", { locale: es })}
                  </>
                ) : (
                  format(dateRange.from, "d 'de' MMMM yyyy", { locale: es })
                )
              ) : (
                "Seleccionar rango de fechas"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={onDateRangeChange}
              numberOfMonths={2}
              className={cn("p-3 pointer-events-auto")}
              locale={es}
              weekStartsOn={1}
            />
          </PopoverContent>
        </Popover>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleQuickSelection(4)}>
            1 Mes
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleQuickSelection(8)}>
            2 Meses
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleQuickSelection(13)}>
            3 Meses
          </Button>
        </div>
      </div>
    </div>
  );
};
