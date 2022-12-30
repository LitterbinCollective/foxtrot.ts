import { Command, CommandClient } from 'detritus-client';

import { GuildSettings } from '@/modules/models';
import { GuildSettingsStore } from '@/modules/stores';
import { listSettings } from '@/modules/utils';

import { BaseCommand } from '../../base';

export class SettingsContext extends Command.Context {
  public settings!: GuildSettings;
}

export class BaseSettingsCommand extends BaseCommand {
  public manageGuildOnly = true;

  public async onBeforeRun(ctx: Command.Context): Promise<boolean> {
    if (!ctx.guild) return false;

    (ctx as SettingsContext).settings = await GuildSettingsStore.getOrCreate(
      ctx.guild.id
    );

    return true;
  }
}

export default class SettingsCommand extends BaseSettingsCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'settings',
      priority: -1,
    });
  }

  public async run(ctx: SettingsContext) {
    ctx.reply({ embed: listSettings(ctx.settings) });
  }
}
