export const availableTimesData: { [key: string]: string[] } = {
	default: [
		'09:00 AM',
		'09:30 AM',
		'10:00 AM',
		'10:30 AM',
		'11:00 AM',
		'11:30 AM',
		'12:00 PM',
		'12:30 PM',
		'02:00 PM',
		'02:30 PM',
		'03:00 PM',
		'03:30 PM',
		'04:00 PM',
		'04:30 PM',
	],
};

export const getAvailableTimesForDate = (date: Date): string[] => {
	// Por ahora, devolvemos los mismos horarios para cada día, excepto los domingos.
	// Esto se puede ampliar para verificar días específicos, horarios de empleados, etc.
	const dayOfWeek = date.getDay(); // Domingo = 0, Sábado = 6

	if (dayOfWeek === 0) {
		// Cerrado los domingos
		return [];
	}

	return availableTimesData.default;
}; 