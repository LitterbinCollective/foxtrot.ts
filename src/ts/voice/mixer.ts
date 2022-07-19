const mixer = require.main?.require('./build/Release/mixer');

export interface Mixer {
  SetVolume(volume: number): number;
  GetVolume(): number;

  AddReadable(data: Buffer): void;
  ClearReadables(): void;

  Process(data: Buffer): Buffer;
};

export const Mixer: {
  new(): Mixer
} = mixer.Mixer;