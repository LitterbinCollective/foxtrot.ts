import { CommandClient, Constants } from 'detritus-client';

import { GuildSettings } from '@/modules/models';
import { UserError } from '@/modules/utils';

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

    const value =
      ctx.settings[key as keyof typeof ctx.settings] ||
      (await this.t(ctx, 'commands.settings.no-value'));
    ctx.reply(value.toString());
  }
}
