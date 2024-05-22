import { Command, Interaction } from 'detritus-client';
import { inspect } from 'util';

import * as Chatsounds from '@clu/chatsounds';
import * as MediaServices from '@clu/managers/mediaservices';
import * as Stores from '@clu/stores';
import * as Utils from '@clu/utils';
import * as Voice from '@clu/voice';

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

export default async function evaluate(
  ctx: Command.Context | Interaction.InteractionContext,
  code: string,
  async = false
) {
  let message = '[empty response]';

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
