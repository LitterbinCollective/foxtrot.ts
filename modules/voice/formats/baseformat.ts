import { VoiceFormatResponse } from '../managers';

export class BaseFormat {
  public regex = /.+/g;
  public printName = 'unknown';
  public readonly formatCredentials: IConfigFormatCredentials;

  constructor(formatCredentials: IConfigFormatCredentials) {
    this.formatCredentials = formatCredentials;
  }

  public process(
    _matched: string
  ):
    | Promise<VoiceFormatResponse[] | VoiceFormatResponse | false>
    | VoiceFormatResponse[]
    | VoiceFormatResponse
    | false {
    return false;
  }
}
