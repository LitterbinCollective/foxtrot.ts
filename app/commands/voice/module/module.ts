import { CommandClient, Constants } from 'detritus-client';

import { BaseVoiceCommand, VoiceContext } from '../base';

export default class ModuleCommand extends BaseVoiceCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'module',
      aliases: ['m'],
      label: 'line',
      type: Constants.CommandArgumentTypes.STRING,
      required: false,
      priority: -1,
    });
  }

  public async run(ctx: VoiceContext, { line }: { line: string }) {
    ctx.voice.invokeModule(line);
  }
}
