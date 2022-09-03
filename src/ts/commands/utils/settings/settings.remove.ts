import { Context } from 'detritus-client/lib/command';
import { CommandArgumentTypes } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { CatvoxCommandClient } from '../../../application';
import { EMOJIS } from '../../../constants';
import GuildSettings from '../../../models/GuildSettings';
import { GuildSettingsStore } from '../../../stores';
import { BaseCommand } from '../../base';
import { listSettings, NO_VALUE_PLACEHOLDER } from './settings';

export default class SettingsRemoveCommand extends BaseCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'settings remove',
      aliases: [ 'settings rm' ],
      type: [
        { name: 'key', type: CommandArgumentTypes.STRING, required: true },
      ]
    });
  }

  public async run(ctx: Context, { key }: { key: string }) {
    if (!ctx.guild) return;
    const settings = await GuildSettingsStore.getOrCreate(ctx.guild.id);
    const { properties } = GuildSettings.jsonSchema;

    if (!properties[key as keyof typeof properties])
      throw new Error('unknown setting');

    await settings.$query().patch({ [key]: null });

    const embed = listSettings(settings);
    embed.setTitle(
      EMOJIS.CHECK +
      ' Set ' +
      Markup.codestring(key) +
      ' to ' +
      Markup.codestring(NO_VALUE_PLACEHOLDER)
    );
    ctx.reply({ embed });
  }
}