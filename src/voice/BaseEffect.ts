export default class BaseEffect {
  public effect = '';
  public enabled = false;

  get toString(): string {
    if (!this.enabled) return '';
    return this.effect;
  }
}
