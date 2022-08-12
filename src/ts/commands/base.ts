import { Command, Interaction } from 'detritus-client';
import { ParsedArgs } from 'detritus-client/lib/command';
import { Embed } from 'detritus-client/lib/utils';

import {
  CatvoxCommandClient,
  CatvoxInteractionCommandClient,
} from '../Application';
import { EMBED_COLORS } from '../constants';
import {
  ApplicationCommandTypes,
  MessageFlags,
} from 'detritus-client/lib/constants';

export class BaseCommand extends Command.Command {
  public readonly commandClient!: CatvoxCommandClient;
  public readonly disableDm = true;

  // public onBeforeRun(ctx: Command.Context, _args: any) {
  //  return ctx.user.isClientOwner;
  // }

  public errorNoHalt(ctx: Command.Context, error: Error) {
    const { name, message } = error;
    const embed = new Embed({
      title: ':bomb: Runtime Error',
      description: `**${name}**: ${message}`,
      color: EMBED_COLORS.ERR,
    });

    ctx.reply({ embed });
  }

  public onRunError(ctx: Command.Context, _args: ParsedArgs, error: Error) {
    this.errorNoHalt(ctx, error);

    this.commandClient.application.logger.error(error);
  }

  public onTypeError(ctx: Command.Context, _args: ParsedArgs, errors: any) {
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

    ctx.reply({ embed });
  }
}
