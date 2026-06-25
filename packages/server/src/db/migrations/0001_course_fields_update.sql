ALTER TABLE "courses" DROP COLUMN "ects";--> statement-breakpoint
ALTER TABLE "courses" DROP COLUMN "max_participants";--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "course_objective" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "registration_info" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "teaching_method" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "online_mode" text;
