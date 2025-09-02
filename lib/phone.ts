// Utilidades de teléfono para ORION

/**
 * Valida si un número está en formato E.164
 */
export function isValidE164(phone: string): boolean {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
}

/**
 * Formatea un número de teléfono mexicano a E.164
 */
export function formatToE164(phone: string): string {
  // Remover todos los caracteres no numéricos
  const cleaned = phone.replace(/\D/g, '');
  
  // Si empieza con 0, removerlo
  const withoutLeadingZero = cleaned.startsWith('0') ? cleaned.slice(1) : cleaned;
  
  // Si tiene 10 dígitos, agregar +52
  if (withoutLeadingZero.length === 10) {
    return `+52${withoutLeadingZero}`;
  }
  
  // Si ya tiene código de país, agregar +
  if (withoutLeadingZero.length === 12 && withoutLeadingZero.startsWith('52')) {
    return `+${withoutLeadingZero}`;
  }
  
  // Si ya está en formato E.164, devolver tal como está
  if (withoutLeadingZero.startsWith('+')) {
    return withoutLeadingZero;
  }
  
  // Por defecto, asumir que es mexicano
  return `+52${withoutLeadingZero}`;
}

/**
 * Formatea un número E.164 para mostrar en la UI
 */
export function formatForDisplay(phone: string): string {
  if (!isValidE164(phone)) {
    return phone; // Devolver tal como está si no es válido
  }
  
  // Para números mexicanos (+52)
  if (phone.startsWith('+52')) {
    const number = phone.slice(3);
    if (number.length === 10) {
      return `${number.slice(0, 2)} ${number.slice(2, 6)} ${number.slice(6)}`;
    }
  }
  
  // Para otros países, mostrar con espacios cada 3-4 dígitos
  const countryCode = phone.slice(0, 3);
  const number = phone.slice(3);
  
  if (number.length <= 6) {
    return `${countryCode} ${number}`;
  } else {
    return `${countryCode} ${number.slice(0, 3)} ${number.slice(3)}`;
  }
}

/**
 * Extrae solo los dígitos de un número de teléfono
 */
export function extractDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}
