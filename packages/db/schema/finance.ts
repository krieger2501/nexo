import { pgSchema, uuid, text, numeric, boolean, timestamp, date } from 'drizzle-orm/pg-core';
import { users } from './auth';

export const financeSchema = pgSchema('finance');

export const accounts = financeSchema.table('accounts', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	type: text('type').notNull().default('checking'),
	balance: numeric('balance', { precision: 12, scale: 2 }).notNull().default('0'),
	currency: text('currency').notNull().default('EUR'),
	includeInTotal: boolean('include_in_total').notNull().default(true),
	color: text('color'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const expenses = financeSchema.table('expenses', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	category: text('category').notNull().default('other'),
	amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
	recurrence: text('recurrence').notNull().default('monthly'),
	dayOfMonth: text('day_of_month'),
	dueDate: date('due_date'),
	accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'set null' }),
	notes: text('notes'),
	startingMonth: text('starting_month'),
	active: boolean('active').notNull().default(true),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const income = financeSchema.table('income', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
	recurrence: text('recurrence').notNull().default('monthly'),
	dayOfMonth: text('day_of_month'),
	expectedDate: date('expected_date'),
	received: boolean('received').notNull().default(false),
	accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'set null' }),
	notes: text('notes'),
	startingMonth: text('starting_month'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const debts = financeSchema.table('debts', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	direction: text('direction').notNull(),
	counterparty: text('counterparty').notNull(),
	amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
	paid: boolean('paid').notNull().default(false),
	dueDate: date('due_date'),
	notes: text('notes'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const userSettings = financeSchema.table('user_settings', {
	userId: text('user_id')
		.primaryKey()
		.references(() => users.id, { onDelete: 'cascade' }),
	displayName: text('display_name'),
	currency: text('currency').notNull().default('EUR'),
	weekStartDay: text('week_start_day').notNull().default('monday'),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export type Account = typeof accounts.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type Income = typeof income.$inferSelect;
export type Debt = typeof debts.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
