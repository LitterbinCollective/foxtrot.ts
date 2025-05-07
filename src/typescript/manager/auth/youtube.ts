import Innertube from 'youtubei.js';

import cookies from '@cluster/managers/cookie';
import { Logger } from '@/utils';

// taken from https://github.com/imputnet/cobalt/blob/a84d0ddc772218fd5f74ec62aee8d95783425428/src/util/generate-youtube-tokens.js
async function act() {
  const tube = await Innertube.create();

  tube.session.once(
    'auth-pending',
    ({ verification_url, user_code }) => {
      Logger.log('click here to authorize:', verification_url);
      Logger.log('enter:', user_code);
    }
  );

  const bail = (...text: any[]) => (Logger.error(...text), process.exit(1));

  tube.session.once('auth-error', (err) => bail('An error occurred:', err));
  tube.session.once('auth', ({ credentials }) => {
    Logger.log(
      'cookie:',
      JSON.stringify(
        Object.entries(credentials)
          .map(([k, v]) => `${k}=${v instanceof Date ? v.toISOString() : v}`)
          .join('; ')
      )
    );
  });

  await tube.session.signIn();
}

act();