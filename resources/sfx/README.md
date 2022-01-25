# `resources/sfx`
This folder contains sound effects the user can play with `sfx` command.

## Adding your own
The simple way to do this is by using Audacity*.
- Import the sound effect
- Select 48000 as the sample rate
- (If the input is mono) convert mono to stereo
- Click File > Audio > Export audio...
- Select the header option as `RAW (header-less)` and encoding as `Signed 16-bit PCM`
- Add sounds to this folder

* - It's also possible to do this through ffmpeg:
```
ffmpeg -i input.mp3 -ar 48000 -ac 2 -f s16le output.raw
```