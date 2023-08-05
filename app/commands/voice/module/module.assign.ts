import { CommandClient, Constants, Utils } from 'detritus-client';

import { BaseVoiceCommand, VoiceContext } from '../base';

export default class ModuleAssignCommand extends BaseVoiceCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'module assign',
      aliases: ['m a', 'module a', 'm assign'],
      label: 'module',
      type: Constants.CommandArgumentTypes.STRING,
      required: true,
    });
  }

  public async run(ctx: VoiceContext, { module }: { module: string }) {
    const isNew = ctx.voice.assignModule(module);
    const template = 'commands.module.' + (isNew ? 'assigned' : 'switched');

    return await ctx.reply(
      await this.t(ctx, template, Utils.Markup.codestring(module))
    );
  }
}
