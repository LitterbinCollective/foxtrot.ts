import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { BaseCommandOption, InteractionContextExtended } from '../../../base';
import { VoiceStore } from '../../../../stores';
import { listEffects } from '../../../../utils';
import { EMOJIS } from '../../../../constants';

export class EffectRemoveCommand extends BaseCommandOption {
  public name = 'remove';
  public description = 'Remove the specified effect from the effect stack.';

  constructor() {
    super({
      options: [
        {
          name: 'effect',
          description: '# of the effect',
          type: ApplicationCommandOptionTypes.INTEGER,
          required: true
        }
      ]
    })
  }

  public run(ctx: InteractionContextExtended, { effect }: { effect: number }) {
    if (!ctx.guild) return;
    const voice = VoiceStore.get(ctx.guild.id);
    if (!voice) return;

    voice.effects.removeEffect(effect);
    const embed = listEffects(voice.effects.list, voice.effects.STACK_LIMIT);
    embed.setTitle(
      EMOJIS.MINUS + ' Removed effect ' + Markup.codestring(effect.toString())
    );
    ctx.editOrRespond({ embed });
  }
}