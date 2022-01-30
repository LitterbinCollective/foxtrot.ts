import { Context } from 'detritus-client/lib/command'

import { CommandClientExtended } from '../../Application'
import BaseCommand from '../../BaseCommand'

export default class RestartCommand extends BaseCommand {
  private notRun: boolean;

  constructor (commandClient: CommandClientExtended) {
    super(commandClient, {
      name: 'restart',
    })
  }

  public onBeforeRun(ctx: Context, _args: any) {
    const letRun = !this.notRun;
    if (letRun)
      this.notRun = true;
    return letRun && ctx.user.isClientOwner;
  }

  public async run (_ctx: Context) {
    this.commandClient.application.voices.forEach(x => {
      x.kill(false),
      x.playInternalSoundeffect('restarting');
    })

    setTimeout(
      () => (this.commandClient.application.voices.forEach(x => x.kill()), process.exit(0)),
      3000
    );
  }
}
