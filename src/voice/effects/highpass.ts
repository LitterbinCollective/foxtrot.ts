import BaseEffect from '../foundation/BaseEffect'

export default class HighPassEffect extends BaseEffect {
  public name = 'highpass'
  public options = {
    frequency: 3700
  }

  public get args (): any[] | boolean {
    if (!this.enabled) return false
    const { frequency } = this.options
    return [frequency]
  }
}
