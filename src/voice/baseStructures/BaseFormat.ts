import { Stream } from 'stream';

export default class BaseFormat {
  public regex = /.+/g;
  public printName = 'unknown';

  public onMatch(_matched: string): Promise<Stream | false> | Stream | false {
    return false;
  }
}
