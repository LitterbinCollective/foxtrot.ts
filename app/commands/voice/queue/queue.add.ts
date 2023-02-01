import { Command, CommandClient, Constants } from 'detritus-client';

import { VoiceStore } from '@/modules/stores';

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
      return await ctx.reply('You are not in the voice channel.');
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
      voice = VoiceStore.create(ctx.member.voiceChannel, ctx.channel);
      return voice.queue.push(url, ctx.user);
    }
    if (!voice.canExecuteVoiceCommands(ctx.member))
      return await ctx.reply(
        'You are not in the voice channel this bot is currently in.'
      );
    if (!voice.initialized)
      return await ctx.reply('Voice not yet initialized!');

    await voice.queue.push(url, ctx.user);
  }
}
