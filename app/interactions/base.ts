import { Constants as DetritusConstants, Interaction } from 'detritus-client';

import { checkPermission, UserError } from '@/modules/utils';
import { buildRuntimeErrorEmbed } from '@/modules/utils/shard-specific';

import app from '..';
import { t } from '@/modules/managers/i18n/';
import { GuildSettingsStore } from '@/modules/stores';

export class BaseInteractionCommand<
  ParsedArgsFinished = Interaction.ParsedArgs
> extends Interaction.InteractionCommand<ParsedArgsFinished> {
  public manageGuildOnly = false;
  public ownerOnly = false;
  public readonly disableDm = true;

  public async onBefore(
    ctx: Interaction.InteractionContext
  ): Promise<boolean> {
    if (!ctx.guild) return false;

    const settings = await GuildSettingsStore.getOrCreate(ctx.guild.id);
    let options: { flags: DetritusConstants.MessageFlags } | undefined;

    if (settings.ephemeral || this.ownerOnly)
      options = {
        flags: DetritusConstants.MessageFlags.EPHEMERAL,
      };

    // this will probably keep the interaction valid
    await ctx.respond(
      DetritusConstants.InteractionCallbackTypes
        .DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
      options
    );

    const ownerCheck = this.ownerOnly ? ctx.user.isClientOwner : true;
    const manageGuildCheck = this.manageGuildOnly
      ? checkPermission(ctx, DetritusConstants.Permissions.ADMINISTRATOR) ||
        checkPermission(ctx, DetritusConstants.Permissions.MANAGE_GUILD) ||
        ctx.user.isClientOwner
      : true;
    if (ownerCheck && manageGuildCheck) {
      return true;
    }

    ctx.editOrRespond('🔒');
    return false;
  }

  /**
   * shorthand for "translate"
   * @param ctx command context
   * @param text i18n template key
   * @param values values for the template
   * @returns a promise for language string
   */
  public t(
    ctx: Interaction.InteractionContext,
    text: string,
    ...values: any[]
  ) {
    if (!ctx.guild) return 'no guild';
    return t(ctx.guild, text, ...values);
  }

  public async onRunError(
    ctx: Interaction.InteractionContext,
    _: ParsedArgsFinished,
    error: any
  ) {
    if (!ctx.guild) return;
    if (error instanceof UserError)
      return ctx.editOrRespond(await this.t(ctx, error.message, ...error.formatValues));
    const embed = await buildRuntimeErrorEmbed(ctx.guild, error);
    ctx.editOrRespond({ embed });

    app.logger.error(error);
  }
}

export class BaseCommandOption<
  ParsedArgsFinished = Interaction.ParsedArgs
> extends Interaction.InteractionCommandOption<ParsedArgsFinished> {
  public type = DetritusConstants.ApplicationCommandOptionTypes.SUB_COMMAND;

  public t(
    ctx: Interaction.InteractionContext,
    text: string,
    ...values: any[]
  ) {
    if (!ctx.guild) return 'no guild';
    return t(ctx.guild, text, ...values);
  }
}

export class BaseCommandOptionGroup<
  ParsedArgsFinished = Interaction.ParsedArgs
> extends Interaction.InteractionCommandOption<ParsedArgsFinished> {
  public type =
    DetritusConstants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP;
}

export class BaseSlashCommand<
  ParsedArgsFinished = Interaction.ParsedArgs
> extends BaseInteractionCommand<ParsedArgsFinished> {
  public type = DetritusConstants.ApplicationCommandTypes.CHAT_INPUT;
}
