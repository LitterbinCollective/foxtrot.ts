import { Command, CommandClient, Constants as DetritusConstants } from 'detritus-client';

import sh from '@clu/chatsounds';
import { Constants } from '@clu/utils';
import { VoiceStore } from '@clu/stores';

import { BaseCommand } from '../base';

export default class SfxCommand extends BaseCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'sfx',
      aliases: ['saysound'],
      type: DetritusConstants.CommandArgumentTypes.STRING,
      required: true,
      args: [
        {
          name: 'file',
          type: DetritusConstants.CommandArgumentTypes.BOOL
        }
      ]
    });
  }

  public async run(ctx: Command.Context, { sfx, file }: { sfx: string, file: boolean }) {
    if (!ctx.guild || !ctx.member) return;

    let voice = VoiceStore.get(ctx.guild.id);
    if (voice && (!voice.initialized || !voice.canExecuteVoiceCommands(ctx.member)))
      voice = undefined;

    if (!file && voice)
      return voice.playSoundeffect(sfx);

    const context = sh.new(sfx);
    const buffer = await context.buffer({
      sampleRate: Constants.OPUS_SAMPLE_RATE,
      audioChannels: Constants.OPUS_AUDIO_CHANNELS,
      format: 'ogg'
    });

    if (!buffer || buffer.length > DetritusConstants.MAX_ATTACHMENT_SIZE)
      return await ctx.reply('nope');

    return await ctx.reply({
      file: {
        filename: 'shat.ogg',
        value: buffer
      }
    });
  }
}
