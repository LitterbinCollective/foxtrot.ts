import {
  CommandClient,
  Constants as DetritusConstants,
  Utils,
} from 'detritus-client';

import { GuildSettings } from '@/modules/models';
import {
  Constants,
  listSettings,
  NO_VALUE_PLACEHOLDER,
  UserError,
} from '@/modules/utils';

import { BaseSettingsCommand, SettingsContext } from './settings';

export default class SettingsRemoveCommand extends BaseSettingsCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'settings remove',
      aliases: ['settings rm'],
      type: [
        {
          name: 'key',
          type: DetritusConstants.CommandArgumentTypes.STRING,
          required: true,
        },
      ],
    });
  }

  public async run(ctx: SettingsContext, { key }: { key: string }) {
    const { properties } = GuildSettings.jsonSchema;
    let prop;

    if (
      !(prop = properties[key as keyof typeof properties]) ||
      key === GuildSettings.idColumn
    )
      throw new UserError('unknown setting');

    if (prop.type[prop.type.length - 1] !== 'null')
      throw new UserError('this setting cannot be removed');

    await ctx.settings.$query().patch({ [key]: null });

    const embed = listSettings(ctx.settings);
    embed.setTitle(
      Constants.EMOJIS.CHECK +
        ' Set ' +
        Utils.Markup.codestring(key) +
        ' to ' +
        Utils.Markup.codestring(NO_VALUE_PLACEHOLDER)
    );
    ctx.reply({ embed });
  }
}
