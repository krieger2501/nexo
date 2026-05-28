export type SheetActionVariant = 'primary' | 'secondary' | 'danger';

export type SheetAction = {
	label: string;
	variant?: SheetActionVariant;
	onclick?: () => void;
	// Anchor href — renders as <a>. Mutually exclusive with onclick / formId.
	href?: string;
	// HTML5 form attribute target — renders as <button type="submit"
	// form={formId}>. Lets a sheet-level action submit a sibling form
	// (e.g. "Revoke all sessions" in SessionsSheet).
	formId?: string;
};
