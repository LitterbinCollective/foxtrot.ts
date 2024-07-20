import { BaseEffect } from './baseeffect';

export default class LowPassEffect extends BaseEffect {
  public name = 'lowpass';
  public options = {
    frequency: 3700,
  };
  public optionsRange = {
    frequency: [1, 12000],
  };

  public get args(): any[] | boolean {
    if (!this.enabled) return false;
    const { frequency } = this.options;
    return [frequency];
  }
}
