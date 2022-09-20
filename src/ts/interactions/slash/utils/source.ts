import { BaseSlashCommand, InteractionContextExtended } from '../../base';
import { homepage } from '../../../../../package.json';
import { APPLICATION_NAME } from '../../../constants';

export default class SourceCommand extends BaseSlashCommand {
  public name = 'source';
  public description = 'Source code for ' + APPLICATION_NAME;

  public async run(ctx: InteractionContextExtended) {
    ctx.editOrRespond(homepage);
  }
}
