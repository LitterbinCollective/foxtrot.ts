import { FormatResponse } from '..'

export default class BaseFormat {
  public regex = /.+/g
  public printName = 'unknown'
  public readonly formatCredentials: IConfigFormatCredentials;

  constructor (formatCredentials: IConfigFormatCredentials) {
    this.formatCredentials = formatCredentials;
  }

  public onMatch (_matched: string): Promise<FormatResponse[] | FormatResponse | false> | FormatResponse[] | FormatResponse | false {
    return false
  }
}
