import { RequestTypes } from 'detritus-client-rest';
import { Context } from 'detritus-client/lib/command';
import { InteractionCallbackTypes, MessageComponentButtonStyles } from 'detritus-client/lib/constants';
import { InteractionContext } from 'detritus-client/lib/interaction';
import { InteractionEditOrRespond, Message } from 'detritus-client/lib/structures';
import { ComponentContext, Components, Embed } from 'detritus-client/lib/utils';
import { EMBED_COLORS, EMOJIS } from '../constants';
import { PaginatorsStore } from '../stores';

export interface PaginatorOptions {
  maximumPages?: number;
  message?: Message;
  onEmbed: (page: any, embed: Embed) => void;
  pages: any[];
  target?: string[];
};

enum PageButtonIDs {
  FIRST = 'first',
  PREVIOUS = 'previous',
  RANDOM = 'random',
  NEXT = 'next',
  LAST = 'last',
  STOP = 'stop'
};

const PageButtons = {
  [PageButtonIDs.FIRST]: {
    emoji: EMOJIS.FAST_REVERSE,
    style: MessageComponentButtonStyles.SECONDARY
  },
  [PageButtonIDs.PREVIOUS]: {
    emoji: EMOJIS.PREVIOUS,
    style: MessageComponentButtonStyles.SECONDARY
  },
  [PageButtonIDs.NEXT]: {
    emoji: EMOJIS.NEXT,
    style: MessageComponentButtonStyles.SECONDARY
  },
  [PageButtonIDs.LAST]: {
    emoji: EMOJIS.FAST_FORWARD,
    style: MessageComponentButtonStyles.SECONDARY
  },
  [PageButtonIDs.STOP]: {
    emoji: EMOJIS.STOP,
    style: MessageComponentButtonStyles.DANGER
  },
};

const EXPIRATION = 60 * 1000;
const RATE_LIMIT = 300;

export class Paginator {
  public currentPage: number = 0;
  private dead = false;
  private maximumPages = Infinity;
  private message!: Message;
  private lastRan: number = 0;
  private onEmbed: (page: any, embed: Embed) => void;
  private pages: any[];
  private readonly context: Context | InteractionContext;
  private readonly target: string[];

  constructor(ctx: Context | InteractionContext, options: PaginatorOptions) {
    this.context = ctx;

    this.pages = options.pages;
    this.maximumPages = Math.max(
      Math.min(options.maximumPages || this.pages.length, this.pages.length),
      0
    );
    this.onEmbed = options.onEmbed.bind(this);

    if (options.target)
      this.target = options.target
    else
      this.target = [ ctx.userId ];

    if (options.message)
      this.message = options.message;
  }

  private get channelId() {
    return this.context.channelId;
  }

  private get messageObject() {
    const messageObject: RequestTypes.CreateMessage | InteractionEditOrRespond = {
      components: [],
      embed: this.embed
    };
    if (!this.dead)
      messageObject.components = this.components;
    return messageObject;
  }

  private get components() {
    const components = new Components({
      timeout: EXPIRATION,
      onTimeout: this.kill.bind(this),
      run: this.run.bind(this)
    });

    components.addButton({
      customId: PageButtonIDs.FIRST,
      disabled: this.currentPage === 0,
      ...PageButtons[PageButtonIDs.FIRST]
    });

    components.addButton({
      customId: PageButtonIDs.PREVIOUS,
      disabled: this.currentPage - 1 === -1,
      ...PageButtons[PageButtonIDs.PREVIOUS]
    });

    components.addButton({
      customId: PageButtonIDs.NEXT,
      disabled: this.currentPage + 1 === this.pages.length,
      ...PageButtons[PageButtonIDs.NEXT]
    });

    components.addButton({
      customId: PageButtonIDs.LAST,
      disabled: this.currentPage === this.pages.length - 1,
      ...PageButtons[PageButtonIDs.LAST]
    });

    components.addButton({
      customId: PageButtonIDs.STOP,
      ...PageButtons[PageButtonIDs.STOP]
    });

    return components;
  }

  private run(ctx: ComponentContext) {
    const time = Date.now();
    if (time - this.lastRan < RATE_LIMIT || this.target.indexOf(ctx.userId) === -1)
      return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);

    switch (ctx.customId) {
      case PageButtonIDs.FIRST:
        this.currentPage = 0;
        break;
      case PageButtonIDs.PREVIOUS:
        this.currentPage--;
        break;
      case PageButtonIDs.NEXT:
        this.currentPage++;
        break;
      case PageButtonIDs.LAST:
        this.currentPage = this.pages.length - 1;
        break;
      case PageButtonIDs.STOP:
        this.kill();
        break;
    }

    this.lastRan = time;
    ctx.editOrRespond(this.messageObject);
  }

  public async start() {
    if (this.message) {
      await this.message.edit(this.messageObject);
    } else {
      if (this.context instanceof Context)
        this.message = await this.context.reply(this.messageObject)
      else
        this.message = await this.context.editOrRespond(this.messageObject);
    }
  }

  private get embed(): Embed {
    const embed = new Embed({
      title: `Page ${this.currentPage + 1}/${this.maximumPages}`,
      color: EMBED_COLORS.DEF
    });

    if (this.onEmbed)
      this.onEmbed(this.pages[this.currentPage], embed);

    return embed;
  }

  public kill() {
    if (this.dead) return;
    this.dead = true;
    if (this.channelId && PaginatorsStore.has(this.channelId)) {
      const paginators = PaginatorsStore.get(this.channelId);
      paginators?.delete(this);
    }
    this.message.edit(this.messageObject);
  }
}