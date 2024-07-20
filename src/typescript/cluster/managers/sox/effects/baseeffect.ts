export interface BaseEffectOptions {
  [key: string]: any;
}

export interface BaseEffectOptionsRange {
  [key: string]: number[];
}

export class BaseEffect {
  public enabled = false;
  public name = '';
  public options: BaseEffectOptions = {};
  public optionsRange: BaseEffectOptionsRange = {};

  get speed(): number {
    return 1;
  }

  get args(): any[] | boolean {
    if (!this.enabled) return false;
    return [];
  }
}
