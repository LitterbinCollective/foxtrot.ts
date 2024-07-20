import { Utils } from 'detritus-client';

import modules from '@cluster/voice/modules';

import { BaseVoiceCommandOption, VoiceInteractionContext } from '../base';

export class ModuleAssignCommand extends BaseVoiceCommandOption {
  public name = 'assign';
  public description = 'assign/switch to a voice module';

  constructor() {
    super({
      options: [
        {
          name: 'module',
          description: 'module name.',
          choices: Object.keys(modules).map(x => ({ name: x, value: x })),
          required: true,
        },
      ],
    });
  }

  public async run(ctx: VoiceInteractionContext, { module }: { module: string }) {
    const isNew = ctx.voice.assignModule(module);
    const template = 'commands.module.' + (isNew ? 'assigned' : 'switched');

    return await ctx.editOrRespond(
      await this.t(ctx, template, Utils.Markup.codestring(module))
    );
  }
}