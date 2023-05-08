import { DownloadReturnedValue, MediaServiceResponse } from '../types';

export class MediaService {
  public hosts: string[] = [];
  public patterns: string[] | ((url: URL) => Record<string, string>) = [];
  public noSearch = false;

  public test(url: URL): Promise<URL> | URL {
    return url;
  }

  public download(
    url: string,
    matches: Record<string, string>
  ): Promise<DownloadReturnedValue> | DownloadReturnedValue {
    throw new Error('not implemented');
  }

  public findOne(
    query: string
  ): Promise<MediaServiceResponse> | MediaServiceResponse {
    throw new Error('not implemented');
  }
}
