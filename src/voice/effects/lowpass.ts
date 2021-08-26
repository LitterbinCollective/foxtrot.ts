import BaseEffect from '../foundation/BaseEffect'

export default class LowPassEffect extends BaseEffect {
  public name = 'lowpass'
  public options = {
    frequency: 3700
  }

  public get args (): any[] | boolean {
    if (!this.enabled) return false
    const { frequency } = this.options
    return [frequency]
  }
}
