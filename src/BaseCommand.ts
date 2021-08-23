import { Command } from 'detritus-client';
import { ParsedArgs } from 'detritus-client/lib/command';
import { Embed } from 'detritus-client/lib/utils';
import { CommandClientExtended } from './Application';

export default class BaseCommand extends Command.Command {
  public readonly commandClient: CommandClientExtended;
  public readonly disableDm = true;
  public readonly ERROR_COLOR = 0xaa0000;

  // public onBeforeRun(ctx: Command.Context, _args: any) {
  //  return ctx.user.isClientOwner;
  // }

  public onRunError(
    ctx: Command.Context,
    _args: ParsedArgs,
    { name, message, stack }: Error
  ) {
    const embed = new Embed({
      title: 'Runtime Error',
      description: `**${name}**: ${message}`,
      color: this.ERROR_COLOR,
    });

    console.error(stack);

    ctx.reply({ embed });
  }

  public onTypeError(ctx: Command.Context, _args: ParsedArgs, errors: any) {
    const embed = new Embed({
      title: 'Argument Error',
      color: this.ERROR_COLOR,
    });

    const description: string[] = [];
    for (let key in errors) {
      const message = errors[key].message;
      description.push('`' + key + '`: ' + message);
    }
    embed.setDescription(description.join('\n'));

    ctx.reply({ embed });
  }
}
