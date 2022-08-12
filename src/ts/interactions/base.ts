import { Interaction } from 'detritus-client';
import {
  ApplicationCommandTypes,
  MessageFlags,
} from 'detritus-client/lib/constants';
import { ParsedArgs } from 'detritus-client/lib/interaction';
import { Embed } from 'detritus-client/lib/utils/embed';

import { CatvoxInteractionCommandClient } from '../Application';
import { EMBED_COLORS } from '../constants';

export class InteractionContextExtended extends Interaction.InteractionContext {
  public interactionCommandClient!: CatvoxInteractionCommandClient;
}

export class BaseInteractionCommand<
  ParsedArgsFinished = Interaction.ParsedArgs
> extends Interaction.InteractionCommand<ParsedArgsFinished> {
  public type = ApplicationCommandTypes.CHAT_INPUT;

  public errorNoHalt(ctx: Interaction.InteractionContext, error: Error) {
    const { name, message } = error;
    const embed = new Embed({
      title: ':bomb: Runtime Error',
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
