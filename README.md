# foxtrot
An experimental Discord bot made with detritusjs/client library.

If you're planning to host this not only for yourself, shard it and host it on
multiple servers as it can take up many resources for audio processing.

## Translations/Localization
See `modules/translations/lang/`.

## Prerequisites
- Node.js
- [C++ build tools](https://github.com/nodejs/node-gyp#installation)
- FFmpeg
- SOX
- Postgres server (for production)

## Self-Hosting
1. Install dependencies: `npm install`
2. Configure the application first using `*.example.json` files in `configs/`
directory as a template.
3. Configure the database using `knexfile.example.ts` file.
4. Build the application: `npm run build`.

To run the application in production mode:
1. Set the NODE_ENV environment variable to `production`.
2. Run migrations: `knex migrate:latest`.
3. Run `npm start`.

Or if you are running under a development mode, just run 2 latter commands.