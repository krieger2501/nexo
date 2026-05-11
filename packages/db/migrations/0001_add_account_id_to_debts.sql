ALTER TABLE "finance"."debts" ADD COLUMN "account_id" uuid;--> statement-breakpoint
ALTER TABLE "finance"."debts" ADD CONSTRAINT "debts_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "finance"."accounts"("id") ON DELETE set null ON UPDATE no action;
