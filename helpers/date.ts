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

  // Fallback to native parsing (handles ISO strings)
  const parsed = new Date(dateString);
  return isNaN(parsed.getTime()) ? null : parsed;
}
