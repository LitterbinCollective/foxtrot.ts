import { Command, CommandClient } from 'detritus-client';

import { GuildSettings } from '@clu/models';
import { GuildSettingsStore } from '@clu/stores';
import { Functions } from '@clu/utils';

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
    if (!ctx.guild) return;
    return await ctx.reply({ embed: await Functions.listSettings(ctx.guild, ctx.settings) });
  }
}
