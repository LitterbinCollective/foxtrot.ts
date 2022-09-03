import { Markup } from 'detritus-client/lib/utils';

import { BaseCommandOption, InteractionContextExtended } from '../../../base';
import { VoiceStore } from '../../../../stores';
import { VoiceEffectManager } from '../../../../voice/managers';
import { listEffects } from '../../../../utils';
import { EMOJIS } from '../../../../constants';

export class EffectAddCommand extends BaseCommandOption {
  public name = 'add';
  public description = 'Add an effect to the effect stack.';

  constructor() {
    super({
      options: [
        {
          name: 'effect',
          description: 'Effect to add',
          choices: VoiceEffectManager.getArgumentType(),
          required: true
        }
      ]
    })
  }

  public run(ctx: InteractionContextExtended, { effect }: { effect: string }) {
    if (!ctx.guild) return;
    const voice = VoiceStore.get(ctx.guild.id);
    if (!voice) return;

    const id = voice.effects.addEffect(effect);
    const embed = listEffects(voice.effects.list, voice.effects.STACK_LIMIT);
    const { name } = voice.effects.getEffectInfo(id);
    embed.setTitle(EMOJIS.PLUS + ' Added effect ' + Markup.codestring(effect));
    embed.setFooter('Effect ID: ' + effect + ' (' + name + ')');
    ctx.editOrRespond({ embed });
  }
}