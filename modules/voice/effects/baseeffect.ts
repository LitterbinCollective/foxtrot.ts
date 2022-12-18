export interface BaseEffectOptions {
  [key: string]: any;
}

export interface BaseEffectOptionsRange {
  [key: string]: number[];
}

export class BaseEffect {
  public name = '';
  public enabled = false;
  public options: BaseEffectOptions = {};
  public optionsRange: BaseEffectOptionsRange = {};

  get args(): any[] | boolean {
    if (!this.enabled) return false;
    return [];
  }
}
