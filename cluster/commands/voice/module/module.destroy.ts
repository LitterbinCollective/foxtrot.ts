import { CommandClient } from 'detritus-client';

import { BaseVoiceCommand, VoiceContext } from '../base';

export default class ModuleAssignCommand extends BaseVoiceCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'module destroy',
      aliases: ['m d', 'module d', 'm destroy'],
    });
  }

  public async run(ctx: VoiceContext) {
    ctx.voice.destroyModule();

    return await ctx.reply(
      await this.t(ctx, 'commands.module.destroy')
    );
  }
}
