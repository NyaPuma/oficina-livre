ALTER TABLE "invoices" ADD COLUMN "atcud" varchar(80);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "document_hash" varchar(200);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "certified_number" varchar(80);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "qr_code_url" text;