ALTER TABLE "courses" ADD COLUMN "types" text[] NOT NULL DEFAULT '{}';
--> statement-breakpoint
UPDATE "courses" SET "types" = ARRAY["type"];
--> statement-breakpoint
ALTER TABLE "courses" DROP COLUMN "type";
--> statement-breakpoint
ALTER TABLE "courses" DROP CONSTRAINT "courses_tumonline_id_scrape_run_id_unique";
--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_tumonline_id_unique" UNIQUE("tumonline_id");
