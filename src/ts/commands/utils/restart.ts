import { Context, ParsedArgs } from 'detritus-client/lib/command';

import { GMCommandClient } from '../../Application';
import { BaseCommand } from '../../BaseCommand';

export default class RestartCommand extends BaseCommand {
  private notRun: boolean = false;

  constructor(commandClient: GMCommandClient) {
    super(commandClient, {
      name: 'restart',
    });
  }

  public onBeforeRun(ctx: Context, _: ParsedArgs) {
    const letRun = !this.notRun;
    if (letRun) this.notRun = true;
    return letRun && ctx.user.isClientOwner;
  }

  public async run(_ctx: Context) {
    process.exit(0);
  }
}
