ALTER TABLE "guildSettings" ADD COLUMN "defaultVolume" integer DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE "guildSettings" ADD COLUMN "tts" varchar(255);--> statement-breakpoint
ALTER TABLE "guildSettings" ADD COLUMN "ttsTellMessageAuthor" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "guildSettings" ADD COLUMN "ttsTellJoinLeave" boolean DEFAULT false NOT NULL;