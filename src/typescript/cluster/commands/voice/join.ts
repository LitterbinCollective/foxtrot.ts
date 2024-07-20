import { Command, CommandClient } from 'detritus-client';

import { VoiceStore } from '@cluster/stores';

import { BaseCommand } from '../base';
import { UserError } from '@cluster/utils';

export default class JoinCommand extends BaseCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'join',
      aliases: ['connect', 'j'],
    });
  }

  public async run(ctx: Command.Context) {
    if (!ctx.member || !ctx.guild || !ctx.channel) return;
    if (!ctx.member.voiceChannel)
      throw new UserError('voice-check.member-not-in-voice');

    await VoiceStore.create(ctx.member.voiceChannel, ctx.channel);
  }
}
