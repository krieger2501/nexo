export interface UpcomingEvent {
	id: string;
	label: string;
	amount: number;
	date: string;
	type: 'expense' | 'income' | 'debt';
}
