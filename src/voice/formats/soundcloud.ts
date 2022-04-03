import scdl from 'soundcloud-downloader'

import { ExtendedReadable } from '..'
import BaseFormat from '../foundation/BaseFormat'

export default class SoundcloudFormat extends BaseFormat {
  public regex = /^https?:\/\/(soundcloud\.com|snd\.sc)\/(.*)$/g
  public printName = 'SoundCloud'

  public async onMatch (matched: string) {
    let info: any
    try {
      info = await scdl.getInfo(matched)
    } catch (err) {
      return false
    }

    return async () => {
      const stream: ExtendedReadable = await scdl.download(matched)
      stream.info = {
        title: info.user.username + ' - ' + info.title,
        image: info.artwork_url,
        url: matched
      }
      return stream
    }
  }
}
