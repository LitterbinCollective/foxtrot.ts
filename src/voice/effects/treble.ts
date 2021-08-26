import BaseEffect from '../foundation/BaseEffect'

export default class TrebleEffect extends BaseEffect {
  public name = 'treble'
  public options = {
    gain: 8,
    frequency: 3000,
    width: 50
  }

  public optionsRange = {
    gain: [-20, 20],
    frequency: [2000, 12000],
    width: [0, 100]
  }

  public get args (): any[] | boolean {
    if (!this.enabled) return false
    const { gain, frequency, width } = this.options
    return [gain, frequency, width / 100]
  }
}
