# glowing-memory
An experimental Discord bot made with Detritus library.

## Requirements
A list of required executables that need to be in *PATH*:
- `ffmpeg` - responsible for converting media streams into *sox format*;
- `sox` - responsible for applying effects and converting *sox format* files into the supported by Discord RTC voice servers format.

## Configuration
Please refer to `config.EXAMPLE.json`.

### Google Assistant setup
Please refer to [the installation section of endoplasmic/google-assistant library](https://github.com/endoplasmic/google-assistant#installation).

On the first time of running the Discord command `ga` the library will ask you to go through an authentication URL (in the console)
and paste the result code into the command line. This is only a one-time thing as it stores the authentication token in `savedTokensFile`
config value.

## Running the application
For testing and debugging please use another Discord bot user, as that prevents interference with the stable bot.

```bash
# Install dependencies, including developer ones
npm install

# Build TypeScript source code
npm run build

# Run the application
npm start
```