// Utilidades de tiempo para ORION

/**
 * Obtiene el inicio de la semana (lunes) para una fecha dada
 */
export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  // Si es domingo (0), restamos 6 días para llegar al lunes anterior
  // Si es cualquier otro día, restamos (día - 1) para llegar al lunes de esta semana
  const diff = day === 0 ? -6 : -(day - 1);
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() + diff);
  return weekStart;
}

/**
 * Obtiene el fin de la semana (domingo) para una fecha dada
 */
export function getWeekEnd(date: Date = new Date()): Date {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return weekEnd;
}

/**
 * Verifica si una fecha está dentro de un rango
 */
export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end;
}

/**
 * Suma minutos a una fecha
 */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

/**
 * Formatea una fecha para mostrar en la UI
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formatea solo la hora
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Resta minutos a una fecha ISO string
 */
export function minusMinutes(iso: string, mins: number): string {
  const date = new Date(iso);
  const result = new Date(date.getTime() - mins * 60 * 1000);
  return result.toISOString();
}

/**
 * Verifica si una fecha ISO está dentro de los próximos N minutos
 */
export function isWithinNextMinutes(iso: string, mins: number): boolean {
  const date = new Date(iso);
  const now = new Date();
  const future = new Date(now.getTime() + mins * 60 * 1000);
  return date >= now && date <= future;
}
