import { CommandClient, Constants, Utils } from 'detritus-client';
import { getTableConfig } from 'drizzle-orm/pg-core';

import { UserError } from '@cluster/utils';
import { guildSettings } from '@/db/schema';

import { BaseSettingsCommand, SettingsContext } from './settings';

export default class SettingsGetCommand extends BaseSettingsCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'settings get',
      type: [
        {
          name: 'key',
          type: Constants.CommandArgumentTypes.STRING,
          required: true,
        },
      ],
    });
  }

  public async run(ctx: SettingsContext, { key }: { key: string }) {
    if (!ctx.guild) return;
    const { columns } = getTableConfig(guildSettings);

    const attribute = columns.find(x => x.name === key);
    if (!attribute || attribute.primary)
      throw new UserError('commands.settings.unknown');

    let value = ctx.settings[key as keyof typeof ctx.settings];
    if (value === undefined || value === null)
      value = await this.t(ctx, 'commands.settings.no-value');

    return await ctx.reply(Utils.Markup.codestring(value.toString()));
  }
}
