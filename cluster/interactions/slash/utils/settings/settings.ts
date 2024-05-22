import { Interaction } from 'detritus-client';

import { GuildSettings } from '@clu/models';
import { GuildSettingsStore } from '@clu/stores';

import { BaseCommandOption, BaseSlashCommand } from '../../../base';

export const SettingChoices = Object.keys(GuildSettings.jsonSchema.properties)
  .filter(x => x !== GuildSettings.idColumn)
  .map(x => ({ name: x, value: x }));

export class SettingsInteractionContext extends Interaction.InteractionContext {
  public settings!: GuildSettings;
};

export class BaseSettingsCommandOption extends BaseCommandOption {
  public manageGuildOnly = true;

  public async onBeforeRun(ctx: Interaction.InteractionContext): Promise<boolean> {
    if (!ctx.guild) return false;

    (ctx as SettingsInteractionContext).settings = await GuildSettingsStore.getOrCreate(
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