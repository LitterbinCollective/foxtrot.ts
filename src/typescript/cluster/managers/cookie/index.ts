import { join } from 'path';
import { ValueOf } from 'type-fest';

import BaseManager from '@/managers';
import CookieFile from './cookie';

const SAVE_INTERVAL_MS = 30000;
const BASE_SCAN_PATH = 'cookies/';
export const ABSOLUTE_BASE_SCAN_PATH = join(process.cwd(), BASE_SCAN_PATH);

interface Cookies {
  [key: string]: CookieFile | undefined,
  spotify?: CookieFile,
  youtube?: CookieFile
}

export class CookieManager extends BaseManager<ValueOf<Cookies>> {
  declare public imported: Cookies;
  private interval: NodeJS.Timeout;

  constructor() {
    super({
      loggerTag: 'CookieManager',
      file: true,
      map: (x, _, file) => new CookieFile(file, x),
      scanPath: BASE_SCAN_PATH,
    });

    this.save = this.save.bind(this);
    this.interval = setInterval(this.save, SAVE_INTERVAL_MS);
  }

  public async save() {
    this.logger.debug('saving every cookie file...');
    return await Promise.all(Object.values(this.imported).map(
      x => x?.save()
    ));
  }
}

export default new CookieManager;