
import { writeFile } from 'fs/promises';
import Cookie from './cookie';
import { ABSOLUTE_BASE_SCAN_PATH } from '.';
import { join } from 'path';

export default class CookieJar {
  public clean = true;
  private cookies: Cookie[] = [];
  private filename: string;
  private pick = 0;

  constructor(file: string, data: string | Buffer) {
    this.filename = file;

    for (const cookie of data.toString('utf-8').split('\n'))
      this.cookies.push(new Cookie(this, cookie));
  }

  public async save() {
    if (this.clean) return;
    this.clean = true;

    return await writeFile(
      join(ABSOLUTE_BASE_SCAN_PATH, this.filename),
      this.cookies.map(x => x.toString()).join('\n')
    );
  }

  public rotate() {
    this.pick = (this.pick + 1) % this.cookies.length;
    return this.cookies[this.pick];
  }

  public insert() {}
}