import { Stream } from 'stream'
import { ExtendedReadable } from '..'

export default class BaseFormat {
  public regex = /.+/g
  public printName = 'unknown'

  public onMatch (_matched: string): Promise<ExtendedReadable | false> | ExtendedReadable | false {
    return false
  }
}
