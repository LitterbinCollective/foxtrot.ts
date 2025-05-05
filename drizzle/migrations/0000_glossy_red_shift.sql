CREATE TABLE IF NOT EXISTS "guildSettings" (
	"guildId" varchar(255) PRIMARY KEY NOT NULL,
	"prefix" varchar(255),
	"special" boolean DEFAULT false NOT NULL,
	"allowCorrupt" boolean DEFAULT false NOT NULL,
	"lang" varchar(255),
	"ephemeral" boolean DEFAULT true NOT NULL
);
