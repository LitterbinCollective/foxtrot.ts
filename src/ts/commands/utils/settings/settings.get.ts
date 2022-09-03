import { Context } from 'detritus-client/lib/command';
import { CommandArgumentTypes } from 'detritus-client/lib/constants';

import { CatvoxCommandClient } from '../../../application';
import GuildSettings from '../../../models/guildsettings';
import { GuildSettingsStore } from '../../../stores';
import { BaseCommand } from '../../base';
import { NO_VALUE_PLACEHOLDER } from './settings';

export default class SettingsGetCommand extends BaseCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'settings get',
      type: [
        { name: 'key', type: CommandArgumentTypes.STRING, required: true },
      ]
    });
  }

  public async run(ctx: Context, { key }: { key: string }) {
    if (!ctx.guild) return;
    const settings = await GuildSettingsStore.getOrCreate(ctx.guild.id);
    const { properties } = GuildSettings.jsonSchema;

    if (!properties[key as keyof typeof properties] || key === GuildSettings.idColumn)
      throw new Error('unknown setting');

    const value = settings[key as keyof typeof settings] || NO_VALUE_PLACEHOLDER;
    ctx.reply(value.toString());
  }
}