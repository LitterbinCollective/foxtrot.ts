# foxtrot.ts <img align="right" width="100" src="https://foxtrot.litterbin.dev/abstract.png">
An experimental Discord voice bot made with detritusjs/client library.
Key features include audio effects, many sound effects, volume control,
bitrate control and more.

Before hosting, please read ["self-hosting"](https://foxtrot.litterbin.dev/docs/self-hosting).

## Locale
See [`src/typescript/cluster/managers/i18n/README.md`](https://github.com/LitterbinCollective/foxtrot.ts/blob/master/src/typescript/cluster/managers/i18n/README.md)
for credits and tips.

## Contributions
Contributions (i.e. pull requests) to the project are welcome. Major
changes, however, need to be discussed beforehand.

## Formats
Certain formats require authentication to perform successfully.

This app requires and uses cookies for certain formats, like Spotify and YouTube.
It may also change them when required (e.g. updating authentication tokens),
therefore if you run foxtrot in a read-only environment, the application may
become unstable.

Below is a list of formats that require authorization and the according
instructions on how to set them up properly.

### Spotify
You will need an Android device with root access.
1. Extract client ID and private key with https://github.com/hyugogirubato/KeyDive.
2. Extract cookies (in header format) from open.spotify.com while being logged in.
3. Put these files into the following paths:
  * Widevine client ID: `configs/binary/widevine_client_id.bin`
  * Widevine device private key: `configs/binary/widevine_private_key.pem`
  * Cookies: `cookies/spotify.txt`

### YouTube
Trying to download content from YouTube has became recently hard to do so due to
Google's efforts, hence you may need to maintain it constantly and possibly set
up multiple accounts for foxtrot, as some can be terminated.

> [!CAUTION]
> **DO NOT use accounts that are used by you or registered with your Google account!**
> Doing so will most likely leave your YouTube accounts terminated.

To authorize, you will need to log into YouTube and extract cookies in header format.
Cookies for YouTube are stored at `cookies/youtube.txt`.

This will most likely require constant maintenance, unless you host foxtrot.ts at home.
In this case, authorization isn't needed, and you can use YouTube links with foxtrot, *as
long as you can view videos on there without being logged in.*

## License
foxtrot.ts is licensed under [AGPL-3.0](https://github.com/LitterbinCollective/foxtrot.ts/blob/master/COPYING).
