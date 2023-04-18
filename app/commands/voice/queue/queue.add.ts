import { Command, CommandClient, Constants } from 'detritus-client';

import { VoiceStore } from '@/modules/stores';
import { UserError } from '@/modules/utils';

import { BaseCommand } from '../../base';

export default class QueueAddCommand extends BaseCommand {
  private readonly CONTENT_TYPE_REGEX = /(audio|video)\/.+/;

  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'play',
      aliases: ['p', 'queue add', 'q add', 'queue a', 'q a'],
      label: 'url',
      type: Constants.CommandArgumentTypes.STRING,
    });
  }

  public async run(ctx: Command.Context, { url }: { url?: string }) {
    if (!ctx.member || !ctx.guild || !ctx.channel) return;
    if (!ctx.member.voiceChannel)
      throw new UserError('voice-check.member-not-in-voice');

    if (!url) {
      const attachment = ctx.message.attachments.first();
      if (
        !attachment ||
        attachment.mimetype.match(this.CONTENT_TYPE_REGEX)?.length === 0 ||
        !attachment.url
      )
        return this.onTypeError(
          ctx,
          { url },
          { url: new Error('Missing required parameter') }
        );
      url = attachment.url;
    }

    let voice = VoiceStore.get(ctx.guild.id);
    if (!voice) {
      voice = await VoiceStore.create(ctx.member.voiceChannel, ctx.channel);
      return await voice.queue.push(url, ctx.message);
    }

    if (!voice.canExecuteVoiceCommands(ctx.member))
      throw new UserError('voice-check.member-not-in-voice');

    if (!voice.initialized) throw new UserError('voice-check.not-initialized');

    await voice.queue.push(url, ctx.message);
  }
}
