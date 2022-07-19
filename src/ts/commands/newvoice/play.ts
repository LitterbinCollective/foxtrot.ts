import { Context } from 'detritus-client/lib/command';
import { CommandArgumentTypes } from 'detritus-client/lib/constants';

import { GMCommandClient } from '../../Application';
import { BaseCommand } from '../../BaseCommand';
import NewVoice from '../../voice/new';

export default class NPlayCommand extends BaseCommand {
  private readonly CONTENT_TYPE_REGEX = /(audio|video)\/.+/;

  constructor(commandClient: GMCommandClient) {
    super(commandClient, {
      name: 'play',
      aliases: ['p'],
      label: 'url',
      type: CommandArgumentTypes.STRING,
    });
  }

  public async run(ctx: Context, { url }: { url?: string }) {
    if (!ctx.member || !ctx.guild || !ctx.channel) return;
    if (!ctx.member.voiceChannel)
      return await ctx.reply('You are not in the voice channel.');
    if (!url) {
      const attachment = ctx.message.attachments.first();
      if (!attachment || attachment.contentType?.match(this.CONTENT_TYPE_REGEX)?.length === 0 || !attachment.url)
        return this.onTypeError(ctx, { url }, { url: { message: 'Missing required parameter' } });
      url = attachment.url;
    }

    let voice = this.commandClient.application.newvoices.get(ctx.guild.id);
    if (!voice) {
      voice = new NewVoice(
        this.commandClient.application,
        ctx.member.voiceChannel,
        ctx.channel
      );
      return voice.queue.push(url, ctx.user);
    }
    if (!voice.canExecuteVoiceCommands(ctx.member))
      return await ctx.reply(
        'You are not in the voice channel this bot is currently in.'
      );
    if (!voice.initialized)
      return await ctx.reply('Voice not yet initialized!');

    voice.queue.push(url, ctx.user);
  }
}
