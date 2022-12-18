import { Constants as DetritusConstants, Interaction } from 'detritus-client';

import { buildRuntimeErrorEmbed, Constants } from '@/modules/utils';

import app from '..';

export class BaseInteractionCommand<ParsedArgsFinished = Interaction.ParsedArgs> extends Interaction.InteractionCommand<ParsedArgsFinished> {
  public manageGuildOnly = false;
  public ownerOnly = false;
  public readonly disableDm = true;

  public onBefore(ctx: Interaction.InteractionContext): boolean | Promise<boolean> {
    ctx.respond(DetritusConstants.InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, {
      flags: DetritusConstants.MessageFlags.EPHEMERAL,
    });

    const ownerCheck = this.ownerOnly ? ctx.user.isClientOwner : true;
    const manageGuildCheck = this.manageGuildOnly ? ctx.member &&
      (ctx.member.permissions & Constants.MANAGE_GUILD_PERMISSION) ===
      Constants.MANAGE_GUILD_PERMISSION : true;
    if (ownerCheck || manageGuildCheck) {
      return true;
    }

    ctx.editOrRespond('🔒');
    return false;
  }

  public onRunError(
    ctx: Interaction.InteractionContext,
    _: ParsedArgsFinished,
    error: any
  ) {
    if (error.constructor.name === 'Error')
      return ctx.editOrRespond(error.message);
    const embed = buildRuntimeErrorEmbed(error);
    ctx.editOrRespond({ embed });

    app.logger.error(error);
  }
}

export class BaseCommandOption<ParsedArgsFinished = Interaction.ParsedArgs> extends Interaction.InteractionCommandOption<ParsedArgsFinished> {
  public type = DetritusConstants.ApplicationCommandOptionTypes.SUB_COMMAND;
}

export class BaseCommandOptionGroup<ParsedArgsFinished = Interaction.ParsedArgs> extends Interaction.InteractionCommandOption<ParsedArgsFinished> {
  public type = DetritusConstants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP;
}

export class BaseSlashCommand<ParsedArgsFinished = Interaction.ParsedArgs> extends BaseInteractionCommand<ParsedArgsFinished> {
  public type = DetritusConstants.ApplicationCommandTypes.CHAT_INPUT;
}
