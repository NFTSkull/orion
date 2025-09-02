import { formatDate } from '@/lib/time';

/**
 * Renderiza mensaje de recordatorio de cita
 */
export function renderReminderMessage(ctx: {
  businessName: string;
  leadName?: string | null;
  datetimeLocal: string;
  address?: string | null;
}): string {
  const { businessName, leadName, datetimeLocal, address } = ctx;
  const name = leadName || 'Cliente';
  const date = formatDate(datetimeLocal);
  
  let message = `Hola ${name}! 👋\n\n`;
  message += `Te recordamos tu cita con ${businessName}:\n`;
  message += `📅 ${date}\n`;
  
  if (address) {
    message += `📍 ${address}\n`;
  }
  
  message += `\nSi necesitas cambiar o cancelar, contáctanos pronto.\n\n`;
  message += `¡Te esperamos! 😊`;
  
  return message;
}

/**
 * Renderiza digest semanal
 */
export function renderWeeklyDigest(ctx: {
  businessName: string;
  weekRange: string;
  leads: number;
  bookings: number;
  paidMXN: number;
  conversionPct: number;
}): string {
  const { businessName, weekRange, leads, bookings, paidMXN, conversionPct } = ctx;
  const amount = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(paidMXN / 100);
  
  let message = `📊 Resumen Semanal - ${businessName}\n`;
  message += `📅 ${weekRange}\n\n`;
  message += `🎯 Nuevos leads: ${leads}\n`;
  message += `📅 Citas agendadas: ${bookings}\n`;
  message += `💰 Ingresos: ${amount}\n`;
  message += `📈 Conversión: ${conversionPct}%\n\n`;
  
  if (conversionPct >= 50) {
    message += `¡Excelente semana! 🎉`;
  } else if (conversionPct >= 25) {
    message += `Buen trabajo, hay espacio para mejorar 💪`;
  } else {
    message += `Es momento de revisar estrategias 📈`;
  }
  
  return message;
}
