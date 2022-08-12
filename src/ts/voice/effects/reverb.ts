import { BaseEffect } from './baseeffect';

export default class ReverbEffect extends BaseEffect {
  public name = 'reverb';
  public options = {
    reverberance: 50,
    hfDamping: 50,
    roomScale: 50,
    stereoDepth: 100,
  };
  public optionsRange = {
    reverberance: [1, 100],
    hfDamping: [1, 100],
    roomScale: [1, 100],
    stereoDepth: [1, 100],
  };

  public get args(): any[] | boolean {
    if (!this.enabled) return false;
    const { reverberance, hfDamping, roomScale, stereoDepth } = this.options;
    return [reverberance, hfDamping, roomScale, stereoDepth];
  }
}
