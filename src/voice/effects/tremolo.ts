import BaseEffect from '../foundation/BaseEffect';

export default class TremoloEffect extends BaseEffect {
  public name = 'tremolo';
  public options = {
    speed: 50,
    depth: 50,
  };

  public optionsRange = {
    depth: [1, 100],
  };

  public get args(): any[] | boolean {
    if (!this.enabled) return false;
    const { speed, depth } = this.options;
    return [speed, depth];
  }
}
