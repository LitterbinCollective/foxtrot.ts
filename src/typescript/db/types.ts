import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { guildSettings } from './schema';

export type GuildSettings = InferSelectModel<typeof guildSettings>;
export type InsertGuildSettings = InferInsertModel<typeof guildSettings>;