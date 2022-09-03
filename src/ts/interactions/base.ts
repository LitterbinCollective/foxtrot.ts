import { Interaction } from 'detritus-client';
import {
  ApplicationCommandOptionTypes,
  ApplicationCommandTypes,
  MessageFlags,
} from 'detritus-client/lib/constants';
import { ParsedArgs } from 'detritus-client/lib/interaction';
import { Embed } from 'detritus-client/lib/utils/embed';

import { CatvoxInteractionCommandClient } from '../application';
import { EMBED_COLORS, EMOJIS } from '../constants';

export class InteractionContextExtended extends Interaction.InteractionContext {
  public interactionCommandClient!: CatvoxInteractionCommandClient;
}

export class BaseInteractionCommand<
  ParsedArgsFinished = Interaction.ParsedArgs
> extends Interaction.InteractionCommand<ParsedArgsFinished> {
  public readonly disableDm = true;

  public errorNoHalt(ctx: Interaction.InteractionContext, error: Error) {
    const { name, message } = error;
    const embed = new Embed({
      title: EMOJIS.BOMB + ' Runtime Error',
      description: `**${name}**: ${message}`,
      color: EMBED_COLORS.ERR,
    });

    ctx.editOrRespond({ embed, flags: MessageFlags.EPHEMERAL });
  }

  public onRunError(
    ctx: InteractionContextExtended,
    args: ParsedArgsFinished,
    error: any
  ) {
    if (error.constructor.name === 'Error')
      return ctx.editOrRespond(error.message);
    this.errorNoHalt(ctx, error);

    ctx.interactionCommandClient.application.logger.error(error);
  }

  public onTypeError(
    ctx: Interaction.InteractionContext,
    _args: ParsedArgs,
    errors: any
  ) {
    const embed = new Embed({
      title: 'Argument Error',
      color: EMBED_COLORS.ERR,
    });

    const description: string[] = [];
    for (const key in errors) {
      const message = errors[key].message;
      description.push('`' + key + '`: ' + message);
    }
    embed.setDescription(description.join('\n'));

    ctx.editOrRespond({ embed, flags: MessageFlags.EPHEMERAL });
  }
}

export class BaseCommandOption<ParsedArgsFinished = Interaction.ParsedArgs> extends Interaction.InteractionCommandOption<ParsedArgsFinished> {
  public type = ApplicationCommandOptionTypes.SUB_COMMAND;
}

export class BaseCommandOptionGroup<ParsedArgsFinished = Interaction.ParsedArgs> extends Interaction.InteractionCommandOption<ParsedArgsFinished> {
  public type = ApplicationCommandOptionTypes.SUB_COMMAND_GROUP;
}

export class BaseSlashCommand<ParsedArgsFinished = Interaction.ParsedArgs> extends BaseInteractionCommand<ParsedArgsFinished> {
  public type = ApplicationCommandTypes.CHAT_INPUT;
}