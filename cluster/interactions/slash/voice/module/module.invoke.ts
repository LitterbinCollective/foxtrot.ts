import { Constants as DetritusConstants } from 'detritus-client';

import { Constants } from '@clu/utils';

import { BaseVoiceCommandOption, VoiceInteractionContext } from '../base';

export class ModuleInvokeCommand extends BaseVoiceCommandOption {
  public name = 'invoke';
  public description = 'invoke voice module';

  constructor() {
    super({
      options: [
        {
          name: 'line',
          description: 'text/argument/subcommand to pass.',
          type: DetritusConstants.ApplicationCommandOptionTypes.STRING,
          required: false
        }
      ]
    });
  }

  public async run(ctx: VoiceInteractionContext, { line }: { line: string }) {
    ctx.voice.invokeModule(line);
    return await ctx.editOrRespond(Constants.EMOJIS.OK);
  }
}