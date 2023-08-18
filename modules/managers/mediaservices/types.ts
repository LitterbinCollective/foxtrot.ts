import { Readable } from 'stream';

export enum MediaServiceResponseMediaType {
  URL = 0,
  FETCH = 1,
  FILE = 2,
}

export interface MediaServiceResponseMediaBase {
  type: number;
}

export interface MediaServiceResponseMediaURL
  extends MediaServiceResponseMediaBase {
  decryptionKey?: string;
  type: MediaServiceResponseMediaType.URL;
  url: string;
}

export interface MediaServiceResponseMediaFile
  extends MediaServiceResponseMediaBase {
  type: MediaServiceResponseMediaType.FILE;
  path: string;
}

export interface MediaServiceResponseMediaFetch
  extends MediaServiceResponseMediaBase {
  type: MediaServiceResponseMediaType.FETCH;
  fetch: () => Promise<Readable | MediaServiceResponseMedia> | Readable | MediaServiceResponseMediaURL;
}

export type MediaServiceResponseMedia = MediaServiceResponseMediaFetch | MediaServiceResponseMediaFile | MediaServiceResponseMediaURL;

export interface MediaServiceResponseInformation {
  metadata?: Record<string, any>;
  title: string;
  author: string;
  duration: number;
  cover?: string | Buffer;
  url: string;
}

export interface MediaServiceResponse {
  media: MediaServiceResponseMediaFetch | MediaServiceResponseMediaURL | MediaServiceResponseMediaFile;
  information: MediaServiceResponseInformation;
}

export type DownloadReturnedValue =
  | MediaServiceResponse
  | MediaServiceResponse[];
