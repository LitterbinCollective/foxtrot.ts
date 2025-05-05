CREATE TYPE "public"."langSetting" AS ENUM('en', 'ja', 'ru', 'sv', 'ua');--> statement-breakpoint
CREATE TYPE "public"."ttsSetting" AS ENUM('chatsounds', 'yandex');--> statement-breakpoint
ALTER TABLE "guildSettings" ALTER COLUMN "lang" SET DEFAULT 'en'::"public"."langSetting";--> statement-breakpoint
ALTER TABLE "guildSettings" ALTER COLUMN "lang" SET DATA TYPE "public"."langSetting" USING "lang"::"public"."langSetting";--> statement-breakpoint
ALTER TABLE "guildSettings" ALTER COLUMN "tts" SET DATA TYPE "public"."ttsSetting" USING "tts"::"public"."ttsSetting";