import { Context } from 'detritus-client/lib/command';
import { CommandArgumentTypes } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { CatvoxCommandClient } from '../../../application';
import { EMOJIS } from '../../../constants';
import GuildSettings from '../../../models/guildsettings';
import { GuildSettingsStore } from '../../../stores';
import { BaseCommand } from '../../base';
import { listSettings } from './settings';

export default class SettingsSetCommand extends BaseCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'settings set',
      type: [
        { name: 'key', type: CommandArgumentTypes.STRING, required: true },
        { name: 'value', type: CommandArgumentTypes.STRING, required: true },
      ]
    });
  }

  public async run(ctx: Context, { key, value }: { key: string, value: any }) {
    if (!ctx.guild) return;
    const settings = await GuildSettingsStore.getOrCreate(ctx.guild.id);
    const { properties } = GuildSettings.jsonSchema;

    const attribute = properties[key as keyof typeof properties];
    if (!attribute || key === GuildSettings.idColumn)
      throw new Error('unknown setting');

    let type = attribute.type;

    if (Array.isArray(type))
      type = type[0]
    else
      type = type.split(',')[0];
    switch (type) {
      case 'string':
        break;
      case 'boolean':
        value = value === 'true';
        break;
      default:
        throw new Error(
          'could not convert given value to needed type! ' + type
        );
    }

    await settings.$query().patch({ [key]: value });

    const embed = listSettings(settings);
    embed.setTitle(
      EMOJIS.CHECK +
      ' Set ' +
      Markup.codestring(key) +
      ' to ' +
      Markup.codestring(value)
    );
    ctx.reply({ embed });
  }
}