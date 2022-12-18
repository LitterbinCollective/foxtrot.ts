# foxtrot
An experimental Discord bot made with detritusjs/client library.

If you're planning to host this not only for yourself, host it on multiple servers
as it can take up many resources for audio processing.

## Prerequisites
- Node.js
- [C++ build tools](https://github.com/nodejs/node-gyp#installation)
- FFmpeg
- SOX
- Postgres server (for production)

## Self-Hosting
1. Install dependencies: `npm install --force`
2. Configure the application first using `*.example.json` files in `configs/`
directory as a template.
3. Build the application: `npm run build`.
4. Run migrations: `knex migrate:latest`.

To run the application run `npm start`.