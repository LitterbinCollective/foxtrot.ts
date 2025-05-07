import { Constants as DetritusConstants, Interaction } from 'detritus-client';
import * as Sentry from '@sentry/node';

import { checkPermission, UserError, buildRuntimeErrorEmbed, Logger, logCommandErrorToSentry } from '@cluster/utils';
import { t } from '@cluster/managers/i18n';
import { Queries } from '@/db';
import app from '@cluster/index';
import { getOrCreateSettings } from '@/db/queries';

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

    const settings = await Queries.getOrCreateSettings(ctx.guild.id);
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

    await ctx.editOrRespond(app.emoji('LOCK'));
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
    args: Interaction.ParsedArgs,
    error: any
  ) {
    if (!ctx.guild) return;
    if (error instanceof UserError)
      return ctx.editOrRespond(await this.t(ctx, error.message, ...error.formatValues));

    const id = logCommandErrorToSentry(
      ctx,
      await getOrCreateSettings(ctx.guild.id),
      error,
      this.name,
      args
    );
    const embed = await buildRuntimeErrorEmbed(ctx.guild, id);
    ctx.editOrRespond({ embed });

    Logger.error(error);
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
