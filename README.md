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

## Spotify support
1. Extract client ID and private key with https://github.com/wvdumper/dumper.
2. Extract cookies (in Netscape format) from open.spotify.com while being logged in.
3. Put these files into `configs/` folder and name them accordingly:
  * Widevine client ID: `widevine_client_id.bin`
  * Widevine device private key: `widevine_private_key.pem`
  * Cookies: `spotify_cookies.txt`

## License
foxtrot.ts is licensed under [AGPL-3.0](https://github.com/LitterbinCollective/foxtrot.ts/blob/master/COPYING).
