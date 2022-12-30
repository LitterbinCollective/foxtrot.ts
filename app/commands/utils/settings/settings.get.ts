import { CommandClient, Constants } from 'detritus-client';

import { GuildSettings } from '@/modules/models';
import { NO_VALUE_PLACEHOLDER, UserError } from '@/modules/utils';

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
    const { properties } = GuildSettings.jsonSchema;

    if (
      !properties[key as keyof typeof properties] ||
      key === GuildSettings.idColumn
    )
      throw new UserError('unknown setting');

    const value =
      ctx.settings[key as keyof typeof ctx.settings] || NO_VALUE_PLACEHOLDER;
    ctx.reply(value.toString());
  }
}
