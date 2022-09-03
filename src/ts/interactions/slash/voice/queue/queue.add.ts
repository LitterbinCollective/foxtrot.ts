import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { BaseCommandOption, InteractionContextExtended } from '../../../base';
import { VoiceStore } from '../../../../stores';

export const QUEUE_ADD_DESCRIPTION = 'Add URL to the queue.';
export const QUEUE_ADD_OPTIONS = [
  {
    name: 'url',
    description: 'URL',
    type: ApplicationCommandOptionTypes.STRING,
    required: true,
  },
];

export class QueueAddCommand extends BaseCommandOption {
  public name = 'add';
  public description = QUEUE_ADD_DESCRIPTION;

  constructor() {
    super({
      options: QUEUE_ADD_OPTIONS
    });
  }

  public async run(ctx: InteractionContextExtended, { url }: { url: string }) {
    if (!ctx.guild || !ctx.member || !ctx.channel) return;
    if (!ctx.member.voiceChannel)
      return await ctx.editOrRespond('You are not in the voice channel.')

    let voice = VoiceStore.get(ctx.guild.id);
    if (!voice) {
      voice = VoiceStore.create(ctx.member.voiceChannel, ctx.channel);
      voice.queue.push(url, ctx.user);
      return ctx.editOrRespond('Okay, joining...');
    }
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