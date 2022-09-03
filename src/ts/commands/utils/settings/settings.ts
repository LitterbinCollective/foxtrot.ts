import { Context } from 'detritus-client/lib/command';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { CatvoxCommandClient } from '../../../application';
import { EMBED_COLORS } from '../../../constants';
import GuildSettings from '../../../models/GuildSettings';
import { GuildSettingsStore } from '../../../stores';
import { BaseCommand } from '../../base';

export const NO_VALUE_PLACEHOLDER = '[no value]';

export function listSettings(settings: GuildSettings) {
  const { properties } = GuildSettings.jsonSchema;
  const description = [];
  for (const key in properties)
    description.push(key + ' = ' + (settings[key as keyof typeof settings] || NO_VALUE_PLACEHOLDER));
  return new Embed({
    title: 'Current guild-specific settings',
    color: EMBED_COLORS.DEF,
    description: Markup.codeblock(description.join('\n')),
  });
}

export default class SettingsCommand extends BaseCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'settings',
      priority: -1,
    });
  }

  public async run(ctx: Context) {
    if (!ctx.guild) return;
    const settings = await GuildSettingsStore.getOrCreate(ctx.guild.id);

    ctx.reply({ embed: listSettings(settings) });
  }
}