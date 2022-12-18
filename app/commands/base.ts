import { Command, CommandClient, Utils } from 'detritus-client';

import { buildArgumentErrorEmbed, buildRuntimeErrorEmbed, Constants } from '@/modules/utils';

import app from '..';

export class BaseCommand extends Command.Command {
  public manageGuildOnly = false;
  public ownerOnly = false;
  public readonly commandClient!: CommandClient;
  public readonly disableDm = true;

  public onBefore(ctx: Command.Context): boolean {
    ctx.channel?.triggerTyping();

    const ownerCheck = this.ownerOnly ? ctx.user.isClientOwner : true;
    const manageGuildCheck = this.manageGuildOnly ? ctx.member &&
      (ctx.member.permissions & Constants.MANAGE_GUILD_PERMISSION) ===
      Constants.MANAGE_GUILD_PERMISSION : true;
    if (ownerCheck || manageGuildCheck) {
      return true;
    }

    ctx.reply('🔒');
    return false;
  }

  public onRunError(ctx: Command.Context, _args: Command.ParsedArgs, error: Error) {
    if (error instanceof Error) return ctx.reply(error.message);

    const embed = buildRuntimeErrorEmbed(error);
    ctx.reply({ embed });

    app.logger.error(error);
  }

  public onTypeError(ctx: Command.Context, _args: Command.ParsedArgs, errors: Record<string, Error>) {
    const embed = buildArgumentErrorEmbed(errors);
    ctx.reply({ embed });
  }
}
