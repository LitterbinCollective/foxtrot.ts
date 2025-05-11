import Innertube, { OAuth2Tokens } from 'youtubei.js';

import cookies from '@/managers/cookie';
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
  async function authorized({ credentials }: { credentials: OAuth2Tokens }) {
    const cookie = Object.entries(credentials)
      .map(([k, v]) => `${k}=${v instanceof Date ? v.toISOString() : v}`)
      .join('; ');

    if (!cookies.imported.youtube)
      cookies.new('youtube');

    cookies.imported.youtube?.insert(cookie);
    await cookies.imported.youtube?.save();

    Logger.log('YouTube cookies saved:', cookie);
  }

  tube.session.once('auth-error', (err) => bail('An error occurred:', err));
  tube.session.once('auth', authorized);

  await tube.session.signIn();
}

act();