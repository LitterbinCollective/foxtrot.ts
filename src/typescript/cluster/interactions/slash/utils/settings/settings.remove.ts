import { GuildSettings } from '@cluster/models';
import { Constants, UserError, listSettings } from '@cluster/utils';

import {
  BaseSettingsCommandOption,
  SettingChoices,
  SettingsInteractionContext
} from './settings';

export class SettingsRemoveCommand extends BaseSettingsCommandOption {
  public name = 'remove';
  public description = "remove a setting's value (if possible)";

  constructor() {
    super({
      options: [
        {
          name: 'key',
          description: 'setting name.',
          choices: SettingChoices,
          required: true,
        },
      ],
    });
  }

  public async run(ctx: SettingsInteractionContext, { key }: { key: string }) {
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
    return await ctx.editOrRespond({ embed });
  }
}