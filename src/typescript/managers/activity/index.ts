import BaseManager from '..';
import AbstractActivity from './abstract';

export { default as AbstractActivity } from './abstract';

export default class ActivityManager extends BaseManager<AbstractActivity> {
  constructor(path: string) {
    super(
      {
        create: true,
        logger: 'ActivityManager [' + path + ']',
        path,
      }
    );

    this.start();
  }

  public start() {
    for (const key in this.imported)
      this.imported[key].start();
  }

  public stop() {
    for (const key in this.imported)
      this.imported[key].stop();
  }
}