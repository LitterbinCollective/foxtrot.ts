
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';

import Cookie from './cookie';
import { ABSOLUTE_BASE_SCAN_PATH, CookieManager } from '.';

export default class CookieJar {
  public dirty = false;
  public manager: CookieManager;
  private cookies: Cookie[] = [];
  private filename: string;
  private pick = 0;

  constructor(manager: CookieManager, file: string, data: string | Buffer) {
    this.manager = manager;
    this.filename = file;
    this.reload(data);
  }

  public get path() {
    return join(ABSOLUTE_BASE_SCAN_PATH, this.filename);
  }

  public async save() {
    if (!this.dirty) return;
    this.dirty = false;

    this.manager.logger.debug('dirty cookie jar, saving', this.filename);

    return await writeFile(
      this.path,
      this.cookies.map(x => x.toString()).join('\n')
    );
  }

  public rotate() {
    this.pick = (this.pick + 1) % this.cookies.length;
    return this.cookies[this.pick];
  }

  public insert(cookie: string) {
    this.dirty = true;
    this.cookies.push(new Cookie(this, cookie));
  }

  public async reload(data?: string | Buffer) {
    this.dirty = false;
    this.cookies = [];

    if (!data)
      data = await readFile(this.path);

    for (const cookie of data.toString('utf-8').split('\n'))
      if (cookie.trim().length)
        this.cookies.push(new Cookie(this, cookie));
  }
}