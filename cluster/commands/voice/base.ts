import { Command } from 'detritus-client';

import { BaseCommand } from '../base';
import { VoiceStore } from '@clu/stores';
import Voice from '@clu/voice';

export class VoiceContext extends Command.Context {
  public voice!: Voice;
}

export class BaseVoiceCommand extends BaseCommand {
  public async onBeforeRun(ctx: Command.Context, _: Command.ParsedArgs) {
    if (!ctx.guild || !ctx.member) return false;

    const voice = VoiceStore.get(ctx.guild.id);
    if (!voice) {
      await ctx.reply(await this.t(ctx, 'voice-check.bot-not-in-voice'));
      return false;
    }

    if (!voice.initialized) {
      await ctx.reply(await this.t(ctx, 'voice-check.voice-not-init'));
      return false;
    }

    if (!voice.canExecuteVoiceCommands(ctx.member)) {
      await ctx.reply(await this.t(ctx, 'voice-check.member-not-in-voice'));
      return false;
    }

    (ctx as VoiceContext).voice = voice;

    return true;
  }
}
