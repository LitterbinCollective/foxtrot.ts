import UrlPattern from 'url-pattern';

import BaseManager from '..';
import { MediaService } from './baseservice';

class URLMediaService extends MediaService {

};

export default class MediaServiceManager extends BaseManager<MediaService> {
  private lookup: Record<string, string> = {};
  private url = new URLMediaService();

  constructor() {
    super({
      create: true,
      loggerTag: 'yes',
      scanPath: 'mediaservices/services/'
    });

    this.formLookup();
  }

  public formLookup() {
    this.lookup = {};

    for (const service in this.processors)
      for (const host of this.processors[service].hosts)
        this.lookup[host] = service;
  }

  public async download(url: string | URL) {
    if (typeof url === 'string')
      url = new URL(url);

    const domainParts = url.hostname.split('.');

    // this can break with .co.uk, etc. domains. too bad!
    const domain = domainParts.length === 3 ?
      domainParts.slice(1).join('.') :
      url.hostname;

    try {
      const matched = this.lookup[domain];
      if (!matched)
        throw new Error('nothing found');

      const service = this.processors[matched];
      url = await service.test(url);

      let matches: Record<string, string> | null = null;

      if (typeof service.patterns === 'function')
        matches = service.patterns(url)
      else {
        for (const pattern of service.patterns) {
          matches = new UrlPattern(pattern)
            .match(url.pathname + url.search);
          if (matches) break;
        }
      }

      if (!matches)
        throw new Error('no matches for ' + matched);

      return await service.download(url.href, matches);
    } catch(err) {
      this.logger.debug(err);
      this.logger.debug('looked up nothing for', domain, 'defaulting to url');
      return this.url.download(url.href, {});
    }
  }

  public async search(service: string, query: string) {
    const processor = this.processors[service];

    if (!processor)
      throw new Error('no such service: ' + service);

    return processor.search(query);
  }

  public get commands() {
    return null;
  }
};