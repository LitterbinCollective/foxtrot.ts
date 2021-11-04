import { Context, ParsedArgs } from 'detritus-client/lib/command'
import { Embed } from 'detritus-client/lib/utils';
import dns from 'dns';
import prettyMilliseconds from 'pretty-ms';
import puppeteer from 'puppeteer';
import { promisify } from 'util';

import { CommandClientExtended } from '../../Application'
import BaseCommand from '../../BaseCommand'

export default class HelpCommand extends BaseCommand {
  private bogonAddresses: string[];
  private lookup: any;

  constructor (commandClient: CommandClientExtended) {
    super(commandClient, {
      name: 'screenshot',
      aliases: [ 'ss' ],
      label: 'url',
      required: true
    })

    this.lookup = promisify(dns.lookup)
    this.bogonAddresses = [
      '::1',
      '127.0.0.1',
      'localhost'
    ]
  }

  public async run (ctx: Context, { url }: ParsedArgs) {
    if (!/^https?:\/\//.test(url)) url = 'http://' + url;

    const parsedURL = new URL(url);
    if (!parsedURL) return this.errorNoHalt(ctx, new Error('Invalid URL'));

    let resolved: any;
    try {
      resolved = await this.lookup(parsedURL.host);
    } catch (err) {
      return this.errorNoHalt(ctx, new Error('Could not resolve hostname'));
    }

    if (this.bogonAddresses.indexOf(resolved.address) !== -1)
      return this.errorNoHalt(ctx, new Error('Hostname resolved to a bogon address'))

    const startedAt = Date.now()
    const browser = await puppeteer.launch({
      args: ['--no-sandbox'],
      ignoreHTTPSErrors: true
    })

    const page = await browser.newPage();
    await page.setJavaScriptEnabled(true);
    await page.setViewport({
      width: 1920,
      height: 1080
    });

    try {
      await page.goto(url, {waitUntil: 'networkidle2'});
      const scr = await page.screenshot();
      browser.close();

      let embed = new Embed();
      embed.setAuthor(url, null, url);
      embed.setImage('attachment://ss.png')
      embed.setFooter(`⏰ Took: ${prettyMilliseconds(Date.now() - startedAt)}`)

      ctx.reply({
        embed,
        file: {
          filename: 'ss.png',
          value: scr
        }
      })
    } catch (err) {
      const error = err.toString().split(':')
      error.shift()
      throw new Error('Failed to screenshot the website: ' + error.join(':').trim())
    }
  }
}