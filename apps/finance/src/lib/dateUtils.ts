export function resolveMonthlyDate(year: number, month: number, dayOfMonth: string): Date {
	if (dayOfMonth === 'last_working' || dayOfMonth === 'second_last_working') {
		// Start from the last day of the month
		const d = new Date(year, month + 1, 0);
		// Step back past weekends to find the last working day
		while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
		if (dayOfMonth === 'second_last_working') {
			d.setDate(d.getDate() - 1);
			while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
		}
		return d;
	}
	return new Date(year, month, parseInt(dayOfMonth, 10));
}

export function toDateStr(d: Date): string {
	return d.toISOString().slice(0, 10);
}
