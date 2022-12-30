import {
  ClusterClient,
  Command,
  CommandClient,
  Constants as DetritusConstants,
} from 'detritus-client';

import { Constants } from '@/modules/utils';

import { BaseCommand } from '../base';

export default class KillCommand extends BaseCommand {
  public ownerOnly = true;

  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'kill',
      label: 'self',
      type: DetritusConstants.CommandArgumentTypes.BOOL,
    });
  }

  public async run(_ctx: Command.Context, { self }: { self: boolean }) {
    const manager = (this.commandClient.client as ClusterClient).manager;
    if (manager && !self)
      manager.sendIPC(Constants.EXTERNAL_IPC_OP_CODES.STOP_MANAGER);
    else process.exit(0);
  }
}
