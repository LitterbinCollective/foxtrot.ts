import { Interaction, Constants as DetritusConstants, Structures } from 'detritus-client';

import { VoiceStore } from '@/modules/stores';

import { BaseCommandOption } from '../../../base';
import { Constants, UserError } from '@/modules/utils';

export const QUEUE_ADD_DESCRIPTION = 'add media to the queue';
export const QUEUE_ADD_OPTIONS = [
  {
    name: 'url',
    description: 'url',
    type: DetritusConstants.ApplicationCommandOptionTypes.STRING,
    required: false,
  },
  {
    name: 'file',
    description: 'media file',
    type: DetritusConstants.ApplicationCommandOptionTypes.ATTACHMENT,
    required: false,
  },
];

export class QueueAddCommand extends BaseCommandOption {
  public name = 'add';
  public description = QUEUE_ADD_DESCRIPTION;

  constructor() {
    super({
      options: QUEUE_ADD_OPTIONS,
    });
  }

  public async run(
    ctx: Interaction.InteractionContext,
    { url, file }: { url?: string; file?: Structures.Attachment }
  ) {
    if (!ctx.guild || !ctx.member || !ctx.channel) return;
    if (!ctx.member.voiceChannel)
      throw new UserError('voice-check.member-not-in-voice');

    if (!url && !file) throw new UserError('commands.url-or-file');

    // fuck you
    const media = url || (file ? file.url : '');

    let voice = VoiceStore.get(ctx.guild.id);
    if (!voice) {
      voice = await VoiceStore.create(ctx.member.voiceChannel, ctx.channel);
      await voice.queue.push(media, ctx.user);
      return await ctx.editOrRespond(await this.t(ctx, 'commands.join-msg'));
    }

    if (!voice.canExecuteVoiceCommands(ctx.member))
      throw new UserError('voice-check.member-not-in-voice');

    if (!voice.initialized) throw new UserError('voice-check.not-initialized');

    await voice.queue.push(media, ctx.user);
    await ctx.editOrRespond(Constants.EMOJIS.CHECK);
  }
}
