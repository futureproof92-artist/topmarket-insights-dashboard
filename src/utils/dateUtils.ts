
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
  if (!weeks || weeks.length === 0) {
    return -1;
  }
  
  // Find the week that contains the reference date
  for (let i = 0; i < weeks.length; i++) {
    const start = new Date(weeks[i].semana_inicio);
    const end = new Date(weeks[i].semana_fin);
    
    if (isWithinInterval(referenceDate, { start, end })) {
      return i;
    }
  }
  
  return -1; // Return -1 if no week is found
};

// Initialize weeks in the database if they don't exist
export const initWeeks = async (year: number): Promise<boolean> => {
  try {
    // First check if we already have weeks in the database
    const { data: existingWeeks, error: checkError } = await supabase
      .from('reclutamiento')
      .select('id')
      .limit(1);
    
    if (checkError) {
      return false;
    }
    
    // If weeks exist, don't initialize
    if (existingWeeks && existingWeeks.length > 0) {
      return true;
    }
    
    // Generate weeks for the specified year
    const weeks = generateWeeksForYear(year);
    
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
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
};
