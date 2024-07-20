import { Command, Interaction } from 'detritus-client';
import { inspect } from 'util';

// easy access variables
import * as Chatsounds from '@cluster/chatsounds';
import * as MediaServices from '@cluster/managers/mediaservices';
import * as Stores from '@cluster/stores';
import * as Utils from '@cluster/utils';
import * as Voice from '@cluster/voice';

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

export async function runJS(
  ctx: Command.Context | Interaction.InteractionContext,
  code: string,
  async = false
) {
  let message = 'Nothing was ran.';

  try {
    if (async) {
      const funct = new AsyncFunction(
        'ctx',
        'Chatsounds',
        'MediaServices',
        'Stores',
        'Utils',
        'Voice',
        code
      );
      message = await funct(ctx, Chatsounds, MediaServices, Stores, Utils, Voice);
    } else message = await Promise.resolve(eval(code));

    if (typeof message === 'object') message = inspect(message);
  } catch (err) {
    if (err instanceof Error) message = err.toString();
  }

  return message;
}
