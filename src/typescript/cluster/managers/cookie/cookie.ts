import { writeFile } from 'fs/promises';
import { join } from 'path';
import setCookieParser from 'set-cookie-parser';

import { ABSOLUTE_BASE_SCAN_PATH } from '.';

export default class CookieFile extends Map<string, string> {
  private fileName: string;
  private needsSaving = false;

  constructor(fileName: string, cookies: string | Buffer) {
    super();

    this.fileName = fileName;

    if (cookies instanceof Buffer)
      cookies = cookies.toString('utf-8');

    for (const cookie of cookies.split(';')) {
      const [ key, value ] = cookie.split('=').map(x => x.trim());
      this.set(key, value);
    }
  }

  public set(key: string, value: string) {
    this.needsSaving = true;
    return super.set(key, value);
  }

  public async save() {
    if (!this.needsSaving) return;
    return await writeFile(join(ABSOLUTE_BASE_SCAN_PATH, this.fileName), this.toString());
  }

  public handleSetCookie(header: string | Headers) {
    if (header instanceof Headers) {
      const setCookie = header.get('set-cookie')
      if (!setCookie) return;

      header = setCookie;
    }

    const parsed = setCookieParser(header, { decodeValues: false });
    const current = new Date;
    for (const cookie of parsed) {
      if (!cookie.expires || cookie.expires > current)
        this.set(cookie.name, cookie.value)
      else
        this.delete(cookie.name);
    }
  }

  public toString() {
    return [...this.entries()].reduce(
      (prev, curr) => prev += ';' + curr.join('='),
      ''
    );
  }
}