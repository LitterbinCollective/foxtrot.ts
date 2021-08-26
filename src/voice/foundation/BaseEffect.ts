export default class BaseEffect {
  public name = ''
  public enabled = false
  public options = {}
  public optionsRange = {}

  get args (): any[] | boolean {
    if (!this.enabled) return false
    return []
  }
}
