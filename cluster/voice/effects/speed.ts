import { BaseEffect } from './baseeffect';

// TODO:
export class SpeedEffect extends BaseEffect {
  public name = 'speed';
  public options = {
    speed: 0.5
  };
  public optionsRange = {
    speed: [ 0.1, 100 ],
  };

  public get speed() {
    return this.options.speed;
  }

  public get args(): any[] | boolean {
    if (!this.enabled) return false;
    return [ this.options.speed ];
  }
}
