import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { BaseCommandOption, InteractionContextExtended } from '../../../base';
import { BaseVoiceCommand } from '../base';
import { VoiceStore } from '../../../../stores';

export class QueueAddCommand extends BaseCommandOption {
  public name = 'add';
  public description = 'Add URL to the queue.';

  constructor() {
    super({
      options: [
        {
          name: 'url',
          description: 'URL',
          type: ApplicationCommandOptionTypes.STRING,
          required: true,
        },
      ],
    });
  }

  public async run(ctx: InteractionContextExtended, { url }: { url: string }) {
    if (!ctx.guild || !ctx.member || !ctx.channel) return;
    if (!ctx.member.voiceChannel)
      return await ctx.editOrRespond('You are not in the voice channel.')

    const voice = VoiceStore.get(ctx.guild.id);
    if (!voice) return;
    if (!voice.canExecuteVoiceCommands(ctx.member))
      return await ctx.editOrRespond(
        'You are not in the voice channel this bot is currently in.'
      );
    if (!voice.initialized)
      return await ctx.editOrRespond('Voice not yet initialized!');

    voice.queue.push(url, ctx.user);
    ctx.editOrRespond('Okay.');
  }
}