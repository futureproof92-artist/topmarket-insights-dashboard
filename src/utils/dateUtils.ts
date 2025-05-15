
import { format, startOfWeek, endOfWeek, addWeeks, isSameDay, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

export interface WeekData {
  semana: string;
  semana_inicio: Date;
  semana_fin: Date;
}

// Format week dates in a consistent way
export const formatWeekLabel = (weekStart: Date, weekEnd: Date) => {
  try {
    return `Lun ${format(weekStart, "d 'de' MMM", { locale: es })} a Dom ${format(weekEnd, "d 'de' MMM", { locale: es })}`;
  } catch (error) {
    console.error("[DATE_UTILS] Error formatting week label:", error);
    return "Error de formato";
  }
};

// Generate all weeks for a year
export const generateWeeksForYear = (year: number): WeekData[] => {
  const weeks: WeekData[] = [];
  
  // Start with the first Monday of the year
  let currentDate = new Date(year, 0, 1); // January 1st
  while (currentDate.getDay() !== 1) { // 1 is Monday
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Generate weeks until we reach the next year
  while (currentDate.getFullYear() === year) {
    const weekStart = new Date(currentDate);
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 }); // Week ends on Sunday
    
    const weekNumber = Math.floor((weekStart.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
    
    weeks.push({
      semana: `Semana ${weekNumber} - ${year}`,
      semana_inicio: weekStart,
      semana_fin: weekEnd
    });
    
    // Move to next Monday
    currentDate = addWeeks(currentDate, 1);
  }
  
  return weeks;
};

// Find the current week in a list of weeks
export const findCurrentWeek = (weeks: WeekData[], referenceDate: Date = new Date()): number => {
  let currentWeekIndex = 0;
  
  // Find the week that contains the reference date
  for (let i = 0; i < weeks.length; i++) {
    const start = new Date(weeks[i].semana_inicio);
    const end = new Date(weeks[i].semana_fin);
    
    if (isWithinInterval(referenceDate, { start, end })) {
      currentWeekIndex = i;
      break;
    }
  }
  
  return currentWeekIndex;
};

// Initialize weeks in the database if they don't exist
export const initWeeks2025 = async (): Promise<boolean> => {
  try {
    // First check if we already have weeks in the database
    const { data: existingWeeks, error: checkError } = await supabase
      .from('reclutamiento')
      .select('id')
      .limit(1);
    
    if (checkError) {
      console.error("[DATE_UTILS] Error checking for existing weeks:", checkError);
      return false;
    }
    
    // If weeks exist, don't initialize
    if (existingWeeks && existingWeeks.length > 0) {
      console.log("[DATE_UTILS] Weeks already initialized, skipping");
      return true;
    }
    
    // Generate weeks for 2025
    const weeks = generateWeeksForYear(2025);
    
    // Prepare data for insertion
    const weekData = weeks.map(week => ({
      semana: week.semana,
      semana_inicio: week.semana_inicio.toISOString(),
      semana_fin: week.semana_fin.toISOString(),
      reclutamientos_confirmados: 0,
      freelancers_confirmados: 0
    }));
    
    // Insert all weeks
    const { error: insertError } = await supabase
      .from('reclutamiento')
      .insert(weekData);
    
    if (insertError) {
      console.error("[DATE_UTILS] Failed to initialize weeks:", insertError);
      return false;
    }
    
    console.log("[DATE_UTILS] Successfully initialized 2025 weeks");
    return true;
  } catch (error) {
    console.error("[DATE_UTILS] Unexpected error during week initialization:", error);
    return false;
  }
};
