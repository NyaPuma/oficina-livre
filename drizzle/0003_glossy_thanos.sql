CREATE TYPE "public"."integration_status" AS ENUM('pendente', 'pago', 'concluido', 'falhado', 'cancelado');--> statement-breakpoint
CREATE TABLE "payment_intents" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"provider" varchar(40) NOT NULL,
	"external_id" varchar(160),
	"amount_cents" integer NOT NULL,
	"status" "integration_status" DEFAULT 'pendente' NOT NULL,
	"checkout_url" text,
	"reference" varchar(160),
	"method" varchar(40),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signature_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity" varchar(40) NOT NULL,
	"entity_id" integer NOT NULL,
	"provider" varchar(40) NOT NULL,
	"external_id" varchar(160),
	"status" "integration_status" DEFAULT 'pendente' NOT NULL,
	"signer_name" varchar(160),
	"signer_email" varchar(180),
	"signed_at" timestamp with time zone,
	"certificate_serial" varchar(200),
	"signing_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payment_intents_invoice_idx" ON "payment_intents" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "signature_requests_entity_idx" ON "signature_requests" USING btree ("entity","entity_id");