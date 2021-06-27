import { URL } from 'url';
import { lookup } from 'dns';
import fetch from 'node-fetch';
import BaseFormat from '../foundation/BaseFormat';

export default class URLFormat extends BaseFormat {
  public regex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
  public printName = 'URL';

  private isUrlLocal(url: string) {
    const { hostname } = new URL(url);
    return new Promise((res, rej) => {
      lookup(hostname, (err, address) =>
        err ? rej(err) : res(address === '127.0.0.1')
      );
    });
  }

  public async onMatch(matched: string) {
    if (await this.isUrlLocal(matched)) return false;

    let resp;
    try {
      resp = await fetch(matched);
      if (!resp.headers.get('content-type').startsWith('audio/')) return false;
    } catch (err) {
      return false;
    }

    return resp.body;
  }
}
