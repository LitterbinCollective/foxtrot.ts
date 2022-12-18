import { Command } from 'detritus-client';

import { BaseCommand } from '../base';
import { VoiceStore } from '@/modules/stores';
import Voice from '@/modules/voice';

export class VoiceContext extends Command.Context {
  public voice!: Voice;
}

export class BaseVoiceCommand extends BaseCommand {
  public async onBeforeRun(ctx: Command.Context, _: Command.ParsedArgs) {
    if (!ctx.guild || !ctx.member) return false;

    const voice = VoiceStore.get(ctx.guild.id);
    if (!voice) {
      await ctx.reply('Not in the voice channel.');
      return false;
    }

    if (!voice.initialized) {
      await ctx.reply('Voice not yet initialized!');
      return false;
    }

    if (!voice.canExecuteVoiceCommands(ctx.member)) {
      await ctx.reply(
        'You are not in the voice channel this bot is currently in.'
      );
      return false;
    }

    (ctx as VoiceContext).voice = voice;

    return true;
  }
}
