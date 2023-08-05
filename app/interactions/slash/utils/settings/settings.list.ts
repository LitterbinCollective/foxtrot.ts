import { listSettings } from '@/modules/utils/shard-specific';

import { BaseSettingsCommandOption, SettingsInteractionContext } from './settings';

export class SettingsListCommand extends BaseSettingsCommandOption {
  public name = 'list';
  public description = 'list all settings.';

  public async run(ctx: SettingsInteractionContext) {
    if (!ctx.guild) return;
    return await ctx.editOrRespond({ embed: await listSettings(ctx.guild, ctx.settings) });
  }
}