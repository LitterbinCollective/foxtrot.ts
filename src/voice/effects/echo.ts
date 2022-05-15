import BaseEffect from '../foundation/BaseEffect';

export default class EchoEffect extends BaseEffect {
  public name = 'echos';
  public options = {
    gainIn: 70,
    gainOut: 60,
    delay: 500,
    decay: 60,
  };

  public optionsRange = {
    gainIn: [0, 100],
    gainOut: [0, 100],
    delay: [1, 1000],
    decay: [0, 90],
  };

  private readonly MAX_ECHOS = 7;

  public get args(): any[] | boolean {
    if (!this.enabled) return false;
    const { gainIn, gainOut, delay, decay } = this.options;
    const args: Array<string | number> = [gainIn / 100, gainOut / 100];

    const decayFactor = 1 - decay / 100;
    let delayFactor = 0;
    for (let i = 1 - decayFactor; i > 0; i -= decayFactor) {
      if (Math.floor(i * 100) / 100 == 0) break;
      if (delayFactor >= this.MAX_ECHOS) break;
      delayFactor++;
      args.push(delay * delayFactor, i.toFixed(2));
    }

    return args;
  }
}
