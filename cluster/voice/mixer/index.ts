const mixer = require.main?.require('../build/Release/mixer');

export interface Mixer {
  setVolume(volume: number): number;
  getVolume(): number;

  addReadable(data: Buffer): void;
  clearReadables(): void;

  process(data: Buffer): Buffer;

  setCorruptEnabled(enable: boolean): boolean;
  getCorruptEnabled(): boolean;
  setCorruptEvery(n: number): number;
  getCorruptEvery(): number;
  setCorruptRandSample(n: number): number;
  getCorruptRandSample(): number;
  setCorruptMode(m: number): number;
  getCorruptMode(): number;
}

export const Mixer: {
  new (): Mixer;
} = mixer.Mixer;
