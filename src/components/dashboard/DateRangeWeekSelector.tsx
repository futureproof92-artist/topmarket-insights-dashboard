
import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DateRangeWeekSelectorProps {
  currentIndex: number;
  totalWeeks: number;
  currentWeekLabel: string;
  onPrevious: () => void;
  onNext: () => void;
  loading: boolean;
}

export const DateRangeWeekSelector = ({
  currentIndex,
  totalWeeks,
  currentWeekLabel,
  onPrevious,
  onNext,
  loading
}: DateRangeWeekSelectorProps) => {
  // Verificar si estamos en la última semana
  const isLastWeek = currentIndex >= totalWeeks - 1;

  return (
    <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
      <Button 
        variant="outline" 
        size="icon" 
        onClick={onPrevious} 
        disabled={loading || currentIndex <= 0}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Anterior</span>
      </Button>
      
      <div className="text-center px-4 py-2 min-w-[200px]">
        {loading ? (
          <span className="text-lg font-semibold">Cargando semanas...</span>
        ) : (
          <>
            <h2 className="text-lg font-bold">{currentWeekLabel}</h2>
            <span className="text-xs text-muted-foreground">Semana {currentIndex + 1} de {totalWeeks}</span>
          </>
        )}
      </div>
      
      <Button 
        variant="outline" 
        size={isLastWeek ? "sm" : "icon"}
        onClick={onNext} 
        disabled={loading || isLastWeek}
        className={isLastWeek ? "bg-amber-50 text-amber-600 border-amber-200" : ""}
      >
        {isLastWeek ? (
          "Última semana"
        ) : (
          <>
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Siguiente</span>
          </>
        )}
      </Button>
    </div>
  );
};
