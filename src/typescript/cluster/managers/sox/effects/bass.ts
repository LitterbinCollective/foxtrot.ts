import { BaseEffect } from './baseeffect';

export default class BassEffect extends BaseEffect {
  public name = 'bass';
  public options = {
    gain: 8,
    frequency: 100,
    width: 50,
  };
  public optionsRange = {
    gain: [-20, 20],
    frequency: [0, 300],
    width: [0, 100],
  };

  public get args(): any[] | boolean {
    if (!this.enabled) return false;
    const { gain, frequency, width } = this.options;
    return [gain, frequency, width / 100];
  }
}
