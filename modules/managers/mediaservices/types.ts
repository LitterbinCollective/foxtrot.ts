import { Readable } from 'stream';

export enum MediaServiceResponseMediaType {
  URL = 0,
  FETCH = 1,
}

export interface MediaServiceResponseMediaBase {
  type: number;
}

export interface MediaServiceResponseMediaFetch
  extends MediaServiceResponseMediaBase {
  type: MediaServiceResponseMediaType.FETCH;
  fetch: () => Promise<Readable> | Readable;
}

export interface MediaServiceResponseMediaURL
  extends MediaServiceResponseMediaBase {
  type: MediaServiceResponseMediaType.URL;
  url: string;
}

export interface MediaServiceResponseInformation {
  metadata?: Record<string, any>;
  title: string;
  author: string;
  duration: number;
  cover?: string | Buffer;
  url: string;
}

export interface MediaServiceResponse {
  media: MediaServiceResponseMediaFetch | MediaServiceResponseMediaURL;
  information: MediaServiceResponseInformation;
}

export type DownloadReturnedValue =
  | MediaServiceResponse
  | MediaServiceResponse[];
