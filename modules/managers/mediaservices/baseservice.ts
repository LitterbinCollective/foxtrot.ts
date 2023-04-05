import { MediaServiceResponse } from './types';

export class MediaService {
  public hosts: string[] = [];
  public patterns: string[] | ((url: URL) => Record<string, string>) = [];

  public test(url: URL): Promise<URL> | URL {
    return url;
  }

  public download(url: string, matches: Record<string, string>): Promise<MediaServiceResponse> | MediaServiceResponse {
    throw new Error('not implemented');
  }

  public search(query: string): Promise<MediaServiceResponse> | MediaServiceResponse {
    throw new Error('not implemented');
  }
};