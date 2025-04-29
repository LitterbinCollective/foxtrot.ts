import { join } from 'path';
import { ValueOf } from 'type-fest';

import BaseManager from '@/managers';
import CookieJar from './jar';

const SAVE_INTERVAL_MS = 30000;
const BASE_SCAN_PATH = 'cookies/';
export const ABSOLUTE_BASE_SCAN_PATH = join(process.cwd(), BASE_SCAN_PATH);

interface CookieJars {
  [key: string]: CookieJar | undefined,
  spotify?: CookieJar,
  youtube?: CookieJar
}

export class CookieManager extends BaseManager<ValueOf<CookieJars>> {
  declare public imported: CookieJars;
  private interval: NodeJS.Timeout;

  constructor() {
    super({
      loggerTag: 'CookieManager',
      file: true,
      map: (x, _, file) => new CookieJar(file, x),
      scanPath: BASE_SCAN_PATH,
    });

    this.save = this.save.bind(this);
    this.interval = setInterval(this.save, SAVE_INTERVAL_MS);
  }

  public new(name: string, data: string | Buffer = '') {
    this.logger.debug('creating new cookie jar: ' + name);
    return this.imported[name] = new CookieJar(name, data);
  }

  public async save() {
    this.logger.debug('saving every cookie file...');
    return await Promise.all(Object.values(this.imported).map(
      x => x?.save()
    ));
  }
}

export default new CookieManager;