import { Interaction } from 'detritus-client';
import { getTableConfig } from 'drizzle-orm/pg-core';

import { Queries } from '@/db';
import { guildSettings } from '@/db/schema';
import { GuildSettings } from '@/db/types';

import { BaseCommandOption, BaseSlashCommand } from '../../../base';

export const SettingChoices = getTableConfig(guildSettings).columns
  .filter(x => !x.primary)
  .map(x => ({ name: x.name, value: x.name }));

export class SettingsInteractionContext extends Interaction.InteractionContext {
  public settings!: GuildSettings;
};

export class BaseSettingsCommandOption extends BaseCommandOption {
  public manageGuildOnly = true;

  public async onBeforeRun(ctx: Interaction.InteractionContext): Promise<boolean> {
    if (!ctx.guild) return false;

    (ctx as SettingsInteractionContext).settings = await Queries.getOrCreateSettings(
      ctx.guild.id
    );

    return true;
  }
};

import { SettingsGetCommand } from './settings.get';
import { SettingsListCommand } from './settings.list';
import { SettingsRemoveCommand } from './settings.remove';
import { SettingsSetCommand } from './settings.set';

export default class SettingsCommand extends BaseSlashCommand {
  public name = 'settings';
  public description = '.';

  constructor() {
    super({
      options: [
        new SettingsGetCommand(),
        new SettingsListCommand(),
        new SettingsRemoveCommand(),
        new SettingsSetCommand()
      ],
    });
  }
}