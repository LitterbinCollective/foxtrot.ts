import Innertube from 'youtubei.js';

// taken from https://github.com/imputnet/cobalt/blob/a84d0ddc772218fd5f74ec62aee8d95783425428/src/util/generate-youtube-tokens.js
async function act() {
  const tube = await Innertube.create();

  tube.session.once(
    'auth-pending',
    ({ verification_url, user_code }) => {
      console.log('click here to authorize:', verification_url);
      console.log('enter:', user_code);
    }
  );

  const bail = (...text: any[]) => (console.error(...text), process.exit(1));

  tube.session.once('auth-error', (err) => bail('An error occurred:', err));
  tube.session.once('auth', ({ credentials }) => {
    console.log(
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