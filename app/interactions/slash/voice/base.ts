import { Interaction } from 'detritus-client';

import { VoiceStore } from '@/modules/stores';
import Voice from '@/modules/voice';

import { BaseCommandOption, BaseSlashCommand } from '../../base';

export class VoiceInteractionContext extends Interaction.InteractionContext {
  public voice!: Voice;
}

async function onBeforeRun(ctx: Interaction.InteractionContext) {
  if (!ctx.guild || !ctx.member) return false;

  const voice = VoiceStore.get(ctx.guild.id);
  if (!voice) {
    await ctx.editOrRespond('Not in the voice channel.');
    return false;
  }

  if (!voice.initialized) {
    await ctx.editOrRespond('Voice not yet initialized!');
    return false;
  }

  if (!voice.canExecuteVoiceCommands(ctx.member)) {
    await ctx.editOrRespond(
      'You are not in the voice channel this bot is currently in.'
    );
    return false;
  }

  (ctx as VoiceInteractionContext).voice = voice;

  return true;
}

export class BaseVoiceSlashCommand extends BaseSlashCommand {
  public onBeforeRun(ctx: Interaction.InteractionContext): Promise<boolean> {
    return onBeforeRun(ctx);
  }
}

export class BaseVoiceCommandOption extends BaseCommandOption {
  public onBeforeRun(ctx: Interaction.InteractionContext): Promise<boolean> {
    return onBeforeRun(ctx);
  }
}
