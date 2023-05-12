import {
  CommandClient,
  Constants as DetritusConstants,
  Utils,
} from 'detritus-client';

import { GuildSettings } from '@/modules/models';
import { Constants, listSettings, UserError } from '@/modules/utils';

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
    if (!ctx.guild) return;
    const { properties } = GuildSettings.jsonSchema;
    let prop;

    if (
      !(prop = properties[key as keyof typeof properties]) ||
      key === GuildSettings.idColumn
    )
      throw new UserError('commands.settings.unknown');

    if (prop.type[prop.type.length - 1] !== 'null')
      throw new UserError('commands.settings.not-null');

    await ctx.settings.$query().patch({ [key]: null });

    const embed = await listSettings(ctx.guild, ctx.settings);
    embed.setTitle(
      Constants.EMOJIS.CHECK +
        ' ' +
        (await this.t(
          ctx,
          'commands.settings.set',
          key,
          await this.t(ctx, 'commands.settings.no-value')
        ))
    );
    ctx.reply({ embed });
  }
}
