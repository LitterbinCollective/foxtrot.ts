import { DownloadReturnedValue, MediaServiceResponse } from '../types';

export class MediaService {
  public disableSearch = false;
  public hosts: string[] = [];
  public patterns: string[] | ((url: URL) => Record<string, string>) = [];

  public before(url: URL): URL | Promise<URL> {
    const parts = url.hostname.split('.');
    if (parts.length >= 3 && parts[0] !== 'www')
      throw new Error("hostname has a subdomain, can't continue");

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
