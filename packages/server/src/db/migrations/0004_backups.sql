CREATE TABLE "backups" (
	"code" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
