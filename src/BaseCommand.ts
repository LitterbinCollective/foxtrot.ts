import { Command, Interaction } from 'detritus-client'
import { ParsedArgs } from 'detritus-client/lib/command'
import { Embed } from 'detritus-client/lib/utils'
import * as Sentry from '@sentry/node'

import { CommandClientExtended, InteractionCommandClientExtended } from './Application'
import { EMBED_COLORS } from './constants'
import { ApplicationCommandTypes, MessageFlags } from 'detritus-client/lib/constants'

export class BaseCommand extends Command.Command {
  public readonly commandClient: CommandClientExtended
  public readonly disableDm = true

  // public onBeforeRun(ctx: Command.Context, _args: any) {
  //  return ctx.user.isClientOwner;
  // }

  public errorNoHalt(ctx: Command.Context, error: Error) {
    const { name, message } = error
    const embed = new Embed({
      title: ':bomb: Runtime Error',
      description: `**${name}**: ${message}`,
      color: EMBED_COLORS.ERR
    })

    ctx.reply({ embed })
  }

  public onRunError (
    ctx: Command.Context,
    _args: ParsedArgs,
    error: Error
  ) {
    this.errorNoHalt(ctx, error);

    console.error(error)
    Sentry.captureException(error, {
      tags: {
        command: this.metadata.name,
        loc: 'command'
      }
    })
  }

  public onTypeError (ctx: Command.Context, _args: ParsedArgs, errors: any) {
    const embed = new Embed({
      title: 'Argument Error',
      color: EMBED_COLORS.ERR
    })

    const description: string[] = []
    for (const key in errors) {
      const message = errors[key].message
      description.push('`' + key + '`: ' + message)
    }
    embed.setDescription(description.join('\n'))

    ctx.reply({ embed })
  }
}

export class InteractionContextExtended extends Interaction.InteractionContext {
  public interactionCommandClient: InteractionCommandClientExtended
}

export class BaseInteractionCommand<ParsedArgsFinished = Interaction.ParsedArgs> extends Interaction.InteractionCommand<ParsedArgsFinished> {
  public type = ApplicationCommandTypes.CHAT_INPUT

  public errorNoHalt(ctx: Interaction.InteractionContext, error: Error) {
    const { name, message } = error
    const embed = new Embed({
      title: ':bomb: Runtime Error',
      description: `**${name}**: ${message}`,
      color: EMBED_COLORS.ERR
    })

    ctx.editOrRespond({ embed, flags: MessageFlags.EPHEMERAL })
  }

  public onRunError(ctx: Interaction.InteractionContext, args: ParsedArgsFinished, error: any) {
    this.errorNoHalt(ctx, error);

    console.error(error)
    Sentry.captureException(error, {
      tags: {
        command: this.metadata.name,
        loc: 'interactionCommand'
      }
    })
  }

  public onTypeError (ctx: Interaction.InteractionContext, _args: ParsedArgs, errors: any) {
    const embed = new Embed({
      title: 'Argument Error',
      color: EMBED_COLORS.ERR
    })

    const description: string[] = []
    for (const key in errors) {
      const message = errors[key].message
      description.push('`' + key + '`: ' + message)
    }
    embed.setDescription(description.join('\n'))

    ctx.editOrRespond({ embed, flags: MessageFlags.EPHEMERAL })
  }
}