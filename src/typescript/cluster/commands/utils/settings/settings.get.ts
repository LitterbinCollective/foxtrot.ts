import { CommandClient, Constants, Utils } from 'detritus-client';

import { GuildSettings } from '@cluster/models';
import { UserError } from '@cluster/utils';

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
    const { properties } = GuildSettings.jsonSchema;

    if (
      !properties[key as keyof typeof properties] ||
      key === GuildSettings.idColumn
    )
      throw new UserError('commands.settings.unknown');

    let value = ctx.settings[key as keyof typeof ctx.settings];
    if (value === undefined)
      value = await this.t(ctx, 'commands.settings.no-value');

    return await ctx.reply(Utils.Markup.codestring(value.toString()));
  }
}
