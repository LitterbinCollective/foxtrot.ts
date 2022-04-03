import axios from 'axios';
import { URL } from 'url'
import { lookup } from 'dns'

import BaseFormat from '../foundation/BaseFormat'
import { ExtendedReadable } from '..'

export default class URLFormat extends BaseFormat {
  public regex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g
  public printName = 'URL'

  private async isUrlLocal (url: string) {
    const { hostname } = new URL(url)
    return await new Promise((res, rej) => {
      lookup(hostname, (err, address) =>
        err ? rej(err) : res(address === '127.0.0.1')
      )
    })
  }

  public async onMatch (matched: string) {
    if (await this.isUrlLocal(matched)) return false

    let resp: any
    try {
      resp = await axios({
        method: 'get',
        url: matched,
        responseType: 'stream'
      });
      const contentType = resp.headers['content-type']
      if (!contentType.startsWith('audio/') && !contentType.startsWith('video/')) return false
    } catch (err) {
      return false
    }

    return () => {
      const readable: ExtendedReadable = resp.data
      readable.info = {
        title: new URL(matched).pathname.split('/').pop(),
        url: matched
      }
      return readable
    }
  }
}
