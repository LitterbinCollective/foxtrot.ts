import { join } from 'path';
import { ValueOf } from 'type-fest';

import BaseManager from '@/managers';
import CookieJar from './jar';

const BASE_SCAN_PATH = 'cookies/';
export const ABSOLUTE_BASE_SCAN_PATH = join(process.cwd(), BASE_SCAN_PATH);

interface CookieJars {
  [key: string]: CookieJar | undefined,
  spotify?: CookieJar,
  youtube?: CookieJar
}

export class CookieManager extends BaseManager<ValueOf<CookieJars>> {
  declare public imported: CookieJars;

  constructor() {
    super({
      logger: 'Cookie',
      file: true,
      map: (x, _, file) => new CookieJar(undefined as any, file, x),
      path: BASE_SCAN_PATH,
      watch: true,
    });

    for (const jar of Object.values(this.imported))
      if (jar)
        jar.manager = this;
  }

  public new(name: string, data: string | Buffer = '') {
    this.logger.debug('creating new cookie jar: ' + name);
    return this.imported[name] = new CookieJar(this, name, data);
  }

  public async save() {
    this.logger.debug('saving every cookie file...');

    await Promise.all(
      Object.values(this.imported).map(
        x => x?.save()
      )
    );
  }
}

export default new CookieManager;