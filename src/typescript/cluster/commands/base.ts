import {
  Constants as DetritusConstants,
  Command,
  CommandClient,
} from 'detritus-client';

import { t } from '@cluster/managers/i18n';
import {
  checkPermission,
  Constants,
  UserError,
  buildArgumentErrorEmbed,
  buildRuntimeErrorEmbed
} from '@cluster/utils';

import app from '..';

export class BaseCommand extends Command.Command {
  public manageGuildOnly = false;
  public ownerOnly = false;
  public readonly commandClient!: CommandClient;
  public readonly disableDm = true;

  public onBefore(ctx: Command.Context): boolean {
    /*
      discord is the most stable app to the point we can 100% rely on it
      spoiler alert: { message: 'internal network error', code: 40333 }
    */
    try {
      ctx.channel?.triggerTyping();

      const ownerCheck = this.ownerOnly ? ctx.user.isClientOwner : true;
      const manageGuildCheck = this.manageGuildOnly
        ? checkPermission(ctx, DetritusConstants.Permissions.ADMINISTRATOR) ||
          checkPermission(ctx, DetritusConstants.Permissions.MANAGE_GUILD) ||
          ctx.user.isClientOwner
        : true;
      if (ownerCheck && manageGuildCheck) {
        return true;
      }

      if (ctx.channel?.canAddReactions) ctx.message.react('🔒');
    } catch (err) {}

    return false;
  }

  /**
   * shorthand for "translate"
   * @param ctx command context
   * @param text i18n template key
   * @param values values for the template
   * @returns a promise for language string
   */
  public t(ctx: Command.Context, text: string, ...values: any[]) {
    if (!ctx.guild) return 'no guild';
    return t(ctx.guild, text, ...values);
  }

  public async onRunError(
    ctx: Command.Context,
    _args: Command.ParsedArgs,
    error: Error
  ) {
    if (!ctx.guild) return;
    if (ctx.channel?.canMessage) {
      if (error instanceof UserError)
        return await ctx.reply(
          await this.t(ctx, error.message, ...error.formatValues)
        );

      const embed = await buildRuntimeErrorEmbed(ctx.guild, error);
      ctx.reply({ embed });
    } else if (ctx.channel?.canAddReactions)
      ctx.message.react(Constants.EMOJIS.BOMB);

    app.logger.error(error);
  }

  public async onTypeError(
    ctx: Command.Context,
    _args: Command.ParsedArgs,
    errors: Record<string, Error>
  ) {
    if (!ctx.guild) return;
    if (ctx.channel?.canMessage) {
      const embed = await buildArgumentErrorEmbed(ctx.guild, errors);
      ctx.reply({ embed });
    } else if (ctx.channel?.canAddReactions)
      ctx.message.react(Constants.EMOJIS.QUESTION_MARK);
  }
}
