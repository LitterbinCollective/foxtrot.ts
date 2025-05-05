import setCookieParser from 'set-cookie-parser';

import CookieJar from './jar';

export default class Cookie extends Map<string, string> {
  private jar: CookieJar;

  constructor(jar: CookieJar, values: string | Buffer) {
    super();
    this.jar = jar;

    if (values instanceof Buffer)
      values = values.toString('utf-8');

    for (const cookie of values.toString().split(';')) {
      const [ key, value ] = cookie.split('=').map((x: string) => x.trim());
      this.set(key, value);
    }
  }

  public set(key: string, value: string) {
    this.jar.clean = false;
    return super.set(key, value);
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
      (prev, curr) => prev += (curr[0].length ? `${curr.join('=')};` : ''),
      ''
    );
  }
}