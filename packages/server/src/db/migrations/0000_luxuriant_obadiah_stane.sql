CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"tumonline_id" text NOT NULL,
	"scrape_run_id" integer NOT NULL,
	"course_number" text NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"term_id" text NOT NULL,
	"ects" integer,
	"language" text,
	"description" text,
	"prerequisites" text,
	"max_participants" integer,
	"instructors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tumonline_url" text NOT NULL,
	"has_leftover_spots" boolean DEFAULT false NOT NULL,
	CONSTRAINT "courses_tumonline_id_scrape_run_id_unique" UNIQUE("tumonline_id","scrape_run_id")
);
--> statement-breakpoint
CREATE TABLE "scrape_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp,
	"status" text NOT NULL,
	"courses_upserted" integer,
	"error_message" text
);
--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_scrape_run_id_scrape_runs_id_fk" FOREIGN KEY ("scrape_run_id") REFERENCES "public"."scrape_runs"("id") ON DELETE no action ON UPDATE no action;