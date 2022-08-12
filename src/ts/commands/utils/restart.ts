import { ClusterClient } from 'detritus-client';
import { Context, ParsedArgs } from 'detritus-client/lib/command';
import { CommandArgumentTypes } from 'detritus-client/lib/constants';

import { CatvoxCommandClient } from '../../Application';
import { EXTERNAL_IPC_OP_CODES } from '../../constants';
import { BaseCommand } from '../base';

export default class RestartCommand extends BaseCommand {
  private notRun: boolean = false;

  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'restart',
      label: 'self',
      type: CommandArgumentTypes.BOOL,
    });
  }

  public onBeforeRun(ctx: Context, _: ParsedArgs) {
    const letRun = !this.notRun;
    if (letRun) this.notRun = true;
    return letRun && ctx.user.isClientOwner;
  }

  public async run(_ctx: Context, { self }: { self: boolean }) {
    const manager = (this.commandClient.client as ClusterClient).manager;
    if (manager && !self) manager.sendIPC(EXTERNAL_IPC_OP_CODES.STOP_MGR);
    else process.exit(0);
  }
}
