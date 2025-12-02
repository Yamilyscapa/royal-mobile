const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

export function parseAppointmentDate(dateString: string): Date | null {
  if (!dateString) return null;

  // Handle dd/mm/yyyy coming from the API
  if (dateString.includes('/')) {
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const [dayStr, monthStr, yearStr] = parts;
      const day = parseInt(dayStr, 10);
      const month = parseInt(monthStr, 10) - 1; // Zero-based month
      const year = parseInt(yearStr, 10);

      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        const parsed = new Date(year, month, day);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }
    }
  }

  // Handle ISO strings (yyyy-mm-dd or yyyy-mm-ddThh:mm:ss)
  const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, yearStr, monthStr, dayStr] = isoMatch;
    const parsed = new Date(
      parseInt(yearStr, 10),
      parseInt(monthStr, 10) - 1,
      parseInt(dayStr, 10)
    );
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  const parsed = new Date(dateString);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function parseAppointmentDateTime(dateString: string, timeSlot?: string): Date | null {
  const date = parseAppointmentDate(dateString);
  if (!date) return null;

  if (timeSlot) {
    const [hourStr, minuteStr = '00'] = timeSlot.split(':');
    const hours = parseInt(hourStr, 10);
    const minutes = parseInt(minuteStr, 10);
    if (!isNaN(hours)) {
      date.setHours(hours, isNaN(minutes) ? 0 : minutes, 0, 0);
    }
  }

  return date;
}

interface FormatDisplayOptions {
  includeYear?: boolean;
}

export function formatAppointmentDateDisplay(
  input: string | Date,
  options: FormatDisplayOptions = {}
): string {
  const includeYear = options.includeYear ?? false;
  const date =
    typeof input === 'string'
      ? parseAppointmentDate(input)
      : !isNaN(input.getTime())
      ? input
      : null;

  if (!date) return 'Fecha inválida';

  const dayName = DAY_NAMES[date.getDay()];
  const day = date.getDate();
  const monthName = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();

  return includeYear ? `${dayName} ${day} de ${monthName} de ${year}` : `${dayName} ${day} de ${monthName}`;
}

interface FormatTimeOptions {
  use24Hour?: boolean;
}

export function formatAppointmentTime(timeSlot: string, options: FormatTimeOptions = {}): string {
  if (!timeSlot) return '';
  const [hoursStr, minutesStr = '00'] = timeSlot.split(':');
  const hours = parseInt(hoursStr, 10);
  if (isNaN(hours)) return timeSlot;
  const minutes = minutesStr.padEnd(2, '0');
  if (options.use24Hour) {
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

export function formatDateForBackend(dateInput: string | Date): string {
  if (!dateInput) return '';

  if (typeof dateInput === 'string') {
    if (dateInput.includes('/')) {
      return dateInput;
    }

    const isoMatch = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return `${day}/${month}/${year}`;
    }
  }

  const date =
    typeof dateInput === 'string' ? parseAppointmentDate(dateInput) : new Date(dateInput);
  if (!date) return '';

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function isAppointmentWithinMinutes(
  dateString: string,
  timeSlot: string,
  minutes: number
): boolean {
  const appointmentDate = parseAppointmentDateTime(dateString, timeSlot);
  if (!appointmentDate) return false;
  const now = new Date();
  const differenceMs = appointmentDate.getTime() - now.getTime();
  return differenceMs <= minutes * 60 * 1000;
}

export function areSameAppointmentDay(dateA: string, dateB: string): boolean {
  const parsedA = parseAppointmentDate(dateA);
  const parsedB = parseAppointmentDate(dateB);
  if (!parsedA || !parsedB) return false;
  return parsedA.toDateString() === parsedB.toDateString();
}
