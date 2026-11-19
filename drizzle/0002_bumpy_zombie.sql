CREATE TYPE "public"."inspection_condition" AS ENUM('ok', 'atencao', 'falha');--> statement-breakpoint
CREATE TABLE "inspection_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"inspection_id" integer NOT NULL,
	"label" varchar(160) NOT NULL,
	"condition" "inspection_condition" DEFAULT 'ok' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inspections" (
	"id" serial PRIMARY KEY NOT NULL,
	"work_order_id" integer NOT NULL,
	"token" varchar(64) NOT NULL,
	"status" varchar(30) DEFAULT 'rascunho' NOT NULL,
	"shared_at" timestamp with time zone,
	"acknowledged_at" timestamp with time zone,
	"acknowledgement_name" varchar(160),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"code" varchar(30) NOT NULL,
	"address" text,
	"phone" varchar(40),
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "site_id" integer;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "site_id" integer;--> statement-breakpoint
ALTER TABLE "work_order_photos" ADD COLUMN "inspection_item_id" integer;--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "site_id" integer;--> statement-breakpoint
ALTER TABLE "inspection_items" ADD CONSTRAINT "inspection_items_inspection_id_inspections_id_fk" FOREIGN KEY ("inspection_id") REFERENCES "public"."inspections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inspection_items_inspection_idx" ON "inspection_items" USING btree ("inspection_id");--> statement-breakpoint
CREATE UNIQUE INDEX "inspections_token_unique" ON "inspections" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "sites_code_unique" ON "sites" USING btree ("code");--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_order_photos" ADD CONSTRAINT "work_order_photos_inspection_item_id_inspection_items_id_fk" FOREIGN KEY ("inspection_item_id") REFERENCES "public"."inspection_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "work_orders_site_idx" ON "work_orders" USING btree ("site_id");