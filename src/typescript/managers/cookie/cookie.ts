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
      const [ key, ...value ] = cookie.split('=');
      this.set(key.trim(), value.join('='));
    }
  }

  private get manager() {
    return this.jar.manager;
  }

  public set(key: string, value: string) {
    this.jar.dirty = true;
    return super.set(key, value);
  }

  public delete(key: string) {
    this.jar.dirty = true;
    return super.delete(key);
  }

  public handleSetCookie(header: string | Headers) {
    if (typeof header === 'object') {
      const setCookie = header.get('set-cookie')
      if (!setCookie) return;

      header = setCookie;
    }

    this.manager.logger.debug('handling set-cookie', header);

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
      (prev, curr) =>
        prev += (
          curr[0].length ?
          `${curr.join('=')};` :
          ''
        ),
      ''
    );
  }
}