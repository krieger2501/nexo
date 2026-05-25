CREATE SCHEMA "calorie";
--> statement-breakpoint
CREATE TABLE "calorie"."entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"food_barcode" text,
	"food_user_id" uuid,
	"food_name" text NOT NULL,
	"grams" numeric(7, 1) NOT NULL,
	"unit" text DEFAULT 'g' NOT NULL,
	"kcal" numeric(7, 1) NOT NULL,
	"protein_g" numeric(6, 1) DEFAULT '0' NOT NULL,
	"carbs_g" numeric(6, 1) DEFAULT '0' NOT NULL,
	"fat_g" numeric(6, 1) DEFAULT '0' NOT NULL,
	"fiber_g" numeric(6, 1),
	"sugar_g" numeric(6, 1),
	"meal_slot" text,
	"meal_id" uuid,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calorie"."foods_cache" (
	"barcode" text PRIMARY KEY NOT NULL,
	"name_de" text,
	"name_en" text,
	"name_generic" text,
	"brand" text,
	"kcal_100g" numeric(7, 2),
	"protein_100g" numeric(6, 2),
	"carbs_100g" numeric(6, 2),
	"fat_100g" numeric(6, 2),
	"fiber_100g" numeric(6, 2),
	"sugars_100g" numeric(6, 2),
	"saturated_fat_100g" numeric(6, 2),
	"salt_100g" numeric(6, 2),
	"serving_size_g" numeric(7, 2),
	"image_url" text,
	"raw_off" jsonb,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_accessed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calorie"."meal_template_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"food_barcode" text,
	"food_user_id" uuid,
	"food_name" text NOT NULL,
	"grams" numeric(7, 1) NOT NULL,
	"unit" text DEFAULT 'g' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calorie"."meal_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"meal_slot" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calorie"."profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"sex" text,
	"age" integer,
	"height_cm" numeric(5, 1),
	"weight_kg" numeric(5, 2),
	"activity" integer,
	"goal" text,
	"tier" text DEFAULT 'basic' NOT NULL,
	"target_kcal" integer,
	"target_protein_g" numeric(6, 1),
	"target_carbs_g" numeric(6, 1),
	"target_fat_g" numeric(6, 1),
	"target_fiber_g" numeric(6, 1),
	"target_sugar_g" numeric(6, 1),
	"targets_custom" boolean DEFAULT false NOT NULL,
	"onboarding_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calorie"."user_favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"food_barcode" text,
	"food_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calorie"."user_foods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"brand" text,
	"kcal_100g" numeric(7, 2) NOT NULL,
	"protein_100g" numeric(6, 2) DEFAULT '0' NOT NULL,
	"carbs_100g" numeric(6, 2) DEFAULT '0' NOT NULL,
	"fat_100g" numeric(6, 2) DEFAULT '0' NOT NULL,
	"fiber_100g" numeric(6, 2),
	"sugars_100g" numeric(6, 2),
	"units" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source_barcode" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calorie"."weight_logs" (
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"kg" numeric(5, 2) NOT NULL,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "weight_logs_user_id_date_pk" PRIMARY KEY("user_id","date")
);
--> statement-breakpoint
ALTER TABLE "calorie"."entries" ADD CONSTRAINT "entries_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calorie"."entries" ADD CONSTRAINT "entries_food_user_id_user_foods_id_fk" FOREIGN KEY ("food_user_id") REFERENCES "calorie"."user_foods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calorie"."meal_template_items" ADD CONSTRAINT "meal_template_items_template_id_meal_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "calorie"."meal_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calorie"."meal_template_items" ADD CONSTRAINT "meal_template_items_food_user_id_user_foods_id_fk" FOREIGN KEY ("food_user_id") REFERENCES "calorie"."user_foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calorie"."meal_templates" ADD CONSTRAINT "meal_templates_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calorie"."profiles" ADD CONSTRAINT "profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calorie"."user_favorites" ADD CONSTRAINT "user_favorites_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calorie"."user_favorites" ADD CONSTRAINT "user_favorites_food_user_id_user_foods_id_fk" FOREIGN KEY ("food_user_id") REFERENCES "calorie"."user_foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calorie"."user_foods" ADD CONSTRAINT "user_foods_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calorie"."weight_logs" ADD CONSTRAINT "weight_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "entries_user_logged_idx" ON "calorie"."entries" USING btree ("user_id","logged_at");--> statement-breakpoint
CREATE INDEX "entries_user_meal_idx" ON "calorie"."entries" USING btree ("user_id","meal_id");--> statement-breakpoint
CREATE INDEX "meal_template_items_template_id_idx" ON "calorie"."meal_template_items" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "meal_templates_user_id_idx" ON "calorie"."meal_templates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_favorites_user_id_idx" ON "calorie"."user_favorites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_foods_user_id_idx" ON "calorie"."user_foods" USING btree ("user_id");