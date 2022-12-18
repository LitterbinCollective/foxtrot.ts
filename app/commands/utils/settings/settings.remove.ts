import { CommandClient, Constants as DetritusConstants, Utils } from 'detritus-client';

import { GuildSettings } from '@/modules/models';
import { Constants, listSettings, NO_VALUE_PLACEHOLDER } from '@/modules/utils';

import { BaseSettingsCommand, SettingsContext } from './settings';

export default class SettingsRemoveCommand extends BaseSettingsCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'settings remove',
      aliases: ['settings rm'],
      type: [
        { name: 'key', type: DetritusConstants.CommandArgumentTypes.STRING, required: true },
      ],
    });
  }

  public async run(ctx: SettingsContext, { key }: { key: string }) {
    const { properties } = GuildSettings.jsonSchema;

    if (
      !properties[key as keyof typeof properties] ||
      key === GuildSettings.idColumn
    )
      throw new Error('unknown setting');

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
