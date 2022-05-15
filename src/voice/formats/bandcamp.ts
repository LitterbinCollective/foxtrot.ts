import axios from 'axios';

import { ExtendedReadable, FormatResponse } from '..'
import BaseFormat from '../foundation/BaseFormat'

export default class BandcampFormat extends BaseFormat {
  public regex = /^https?:\/\/(.*).bandcamp.com\/(track|album)\/(.*)$/g
  public printName = 'Bandcamp'
  private tralbumRegex = /<script (.*)src="https?:\/\/s.\.bcbits\.com\/bundle\/bundle\/1\/tralbum_head-(.*)\.js"(.*)data-tralbum="(.*?)"(.*)><\/script>/g;
  private readonly CHARS = {quot: '"', amp: '&'};

  private decodeHTML(str: string) {
    return str.replaceAll(/&(.+?);/g, (m) => this.CHARS[m.slice(1, -1)])
  }

  public async process (matched: string) {
    let info: any = await axios(matched)

    const match = [...info.data.matchAll(this.tralbumRegex)][0][4]
    if (!match) return false

    info = JSON.parse(this.decodeHTML(match))

    const array = await Promise.all(info.trackinfo.map(async (track: any) => {
      async function fetch() {
        const resp = await axios({
          method: 'get',
          url: track.file['mp3-128'],
          responseType: 'stream'
        })
        return resp.data
      }
      const readable: ExtendedReadable = await fetch()

      return {
        readable: readable,
        reprocess: fetch,
        info: {
          title: track.title,
          image: `https://f4.bcbits.com/img/a${info.art_id}_1.jpg`,
          url: info.url,
          duration: track.duration
        }
      }
    }))

    return array as FormatResponse[]
  }
}
