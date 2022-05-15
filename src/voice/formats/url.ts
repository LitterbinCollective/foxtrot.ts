import axios from 'axios'
import { spawn } from 'child_process'
import { lookup } from 'dns'
import { URL } from 'url'

import BaseFormat from '../foundation/BaseFormat'
import { ExtendedReadable } from '..'

export default class URLFormat extends BaseFormat {
  public regex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g
  public printName = 'URL'
  private readonly MODULE_FILE_EXT = [
    'mod',
    's3m',
    'it',
    'xm',
  ]

  private async isUrlLocal (url: string) {
    const { hostname } = new URL(url)
    return await new Promise((res, rej) => {
      lookup(hostname, (err, address) =>
        err ? rej(err) : res(address === '127.0.0.1')
      )
    })
  }

  public async process (matched: string) {
    if (await this.isUrlLocal(matched)) return false

    const filename = new URL(matched).pathname.split('/').pop()
    const isMod = this.MODULE_FILE_EXT.indexOf(filename.split('.').pop().toLowerCase()) !== -1
    let resp: any
    let child: any

    async function connect() {
      resp = await axios({
        method: 'get',
        url: matched,
        responseType: 'stream'
      })
      const contentType = resp.headers['content-type']
      if (!contentType.startsWith('audio/') && !contentType.startsWith('video/') &&
        !isMod) return false
      return true
    }

    function postFetch() {
      let readable: ExtendedReadable

      if (isMod) {
        /*
          * this is a weird way of doing it but since directly piping it
          * doesn't work i have to use it. optional todo: come up with a
          * better idea.
          */
        child = spawn('ffmpeg', [
          '-i', matched,
          '-ar', '48000',
          '-ac', '2',
          '-f', 'wav',
          '-'
        ])
        readable = child.stdout
        readable.cleanup = () =>
          child.kill(9);
      } else
        readable = resp.data

      return readable
    }

    try {
      const result = await connect()
      if (!result) return false
    } catch (err) {
      return false
    }

    return {
      fetch: postFetch,
      reprocess: async () => {
        if (child) child.kill(9)
        await connect()
        return postFetch()
      },
      info: {
        title: filename,
        url: matched
      }
    }
  }
}
