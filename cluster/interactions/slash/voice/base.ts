import { Interaction } from 'detritus-client';

import { VoiceStore } from '@clu/stores';
import Voice from '@clu/voice';

import { BaseCommandOption, BaseSlashCommand } from '../../base';

export class VoiceInteractionContext extends Interaction.InteractionContext {
  public voice!: Voice;
}

async function onBeforeRun(this: any, ctx: Interaction.InteractionContext) {
  if (!ctx.guild || !ctx.member) return false;

  const voice = VoiceStore.get(ctx.guild.id);
  if (!voice) {
    await ctx.editOrRespond(await this.t(ctx, 'voice-check.bot-not-in-voice'));
    return false;
  }

  if (!voice.initialized) {
    await ctx.editOrRespond(await this.t(ctx, 'voice-check.voice-not-init'));
    return false;
  }

  if (!voice.canExecuteVoiceCommands(ctx.member)) {
    await ctx.editOrRespond(
      await this.t(ctx, 'voice-check.member-not-in-voice')
    );
    return false;
  }

  (ctx as VoiceInteractionContext).voice = voice;

  return true;
}

export class BaseVoiceSlashCommand extends BaseSlashCommand {
  public onBeforeRun(ctx: Interaction.InteractionContext): Promise<boolean> {
    return onBeforeRun.call(this, ctx);
  }
}

export class BaseVoiceCommandOption extends BaseCommandOption {
  public onBeforeRun(ctx: Interaction.InteractionContext): Promise<boolean> {
    return onBeforeRun.call(this, ctx);
  }
}
