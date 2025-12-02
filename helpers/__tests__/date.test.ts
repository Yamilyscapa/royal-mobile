import {
  formatAppointmentDateDisplay,
  formatAppointmentTime,
  formatDateForBackend,
  parseAppointmentDate,
  parseAppointmentDateTime,
} from '../date';

describe('appointment date helpers', () => {
  it('parses ISO and DD/MM/YYYY strings consistently', () => {
    const iso = parseAppointmentDate('2025-07-15');
    const ddmm = parseAppointmentDate('15/07/2025');

    expect(iso).not.toBeNull();
    expect(ddmm).not.toBeNull();
    expect(iso?.getTime()).toBe(ddmm?.getTime());
    expect(iso?.getFullYear()).toBe(2025);
    expect(iso?.getMonth()).toBe(6);
    expect(iso?.getDate()).toBe(15);
  });

  it('sets hours when parsing appointment date and time', () => {
    const isoDateTime = parseAppointmentDateTime('2025-07-15', '14:30');
    const ddmmDateTime = parseAppointmentDateTime('15/07/2025', '14:30');

    expect(isoDateTime?.getHours()).toBe(14);
    expect(isoDateTime?.getMinutes()).toBe(30);
    expect(isoDateTime?.getTime()).toBe(ddmmDateTime?.getTime());
  });

  it('formats display dates identically for ISO and DD/MM/YYYY', () => {
    const isoFormatted = formatAppointmentDateDisplay('2025-07-15', { includeYear: true });
    const ddmmFormatted = formatAppointmentDateDisplay('15/07/2025', { includeYear: true });

    expect(isoFormatted).toBe(ddmmFormatted);
    expect(isoFormatted).toContain('15');
    expect(isoFormatted).toContain('julio');
  });

  it('formats backend date strings reliably', () => {
    expect(formatDateForBackend('2025-07-01')).toBe('01/07/2025');
    expect(formatDateForBackend('05/08/2025')).toBe('05/08/2025');
  });

  it('formats appointment times in both 12h and 24h styles', () => {
    expect(formatAppointmentTime('13:05')).toBe('1:05 PM');
    expect(formatAppointmentTime('13:05', { use24Hour: true })).toBe('13:05');
  });
});
