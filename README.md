# catvox
An experimental Discord bot made with detritusjs/client library.

## Prerequisites
- Node.js
- [C++ build tools](https://github.com/nodejs/node-gyp#installation)
- FFmpeg
- SOX
- Postgres server (for production)

## Self-Hosting
1. Install dependencies: `npm install --force`
2. Configure the application first using `config.EXAMPLE.json` file as a
template.
3. Build the application: `npm run build`.
4. Run migrations: `knex migrate:latest`.

To run the application run `npm start`.