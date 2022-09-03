import { BaseSlashCommand, InteractionContextExtended } from '../../base';
import { homepage } from '../../../../../package.json';

export default class SourceCommand extends BaseSlashCommand {
  public name = 'source';
  public description = 'Source code for catvox.';

  public async run(ctx: InteractionContextExtended) {
    ctx.editOrRespond(homepage);
  }
}
