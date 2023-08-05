import {
  Command,
  Constants as DetritusConstants,
  Interaction,
  Structures,
  Utils,
} from 'detritus-client';
import { RequestTypes } from 'detritus-client-rest';

import { t } from '@/modules/managers/i18n/';

import * as Constants from './constants';

export interface PaginatorOptions {
  maximumPages?: number;
  message?: Structures.Message;
  onEmbed: (page: any, embed: Utils.Embed) => void;
  onKill?: () => void;
  pages: any[];
  target?: string[];
}

enum PageButtonIDs {
  FIRST = 'first',
  PREVIOUS = 'previous',
  RANDOM = 'random',
  NEXT = 'next',
  LAST = 'last',
  STOP = 'stop',
}

const PageButtons = {
  [PageButtonIDs.FIRST]: {
    emoji: Constants.EMOJIS.FAST_REVERSE,
    style: DetritusConstants.MessageComponentButtonStyles.SECONDARY,
  },
  [PageButtonIDs.PREVIOUS]: {
    emoji: Constants.EMOJIS.PREVIOUS,
    style: DetritusConstants.MessageComponentButtonStyles.SECONDARY,
  },
  [PageButtonIDs.NEXT]: {
    emoji: Constants.EMOJIS.NEXT,
    style: DetritusConstants.MessageComponentButtonStyles.SECONDARY,
  },
  [PageButtonIDs.LAST]: {
    emoji: Constants.EMOJIS.FAST_FORWARD,
    style: DetritusConstants.MessageComponentButtonStyles.SECONDARY,
  },
  [PageButtonIDs.STOP]: {
    emoji: Constants.EMOJIS.STOP,
    style: DetritusConstants.MessageComponentButtonStyles.DANGER,
  },
};

const EXPIRATION = 60 * 1000;
const RATE_LIMIT = 300;

export class Paginator {
  public currentPage: number = 0;
  private dead = false;
  private maximumPages = Infinity;
  private message!: Structures.Message;
  private lastRan: number = 0;
  private onEmbed: (page: any, embed: Utils.Embed) => void;
  private onKill: () => void;
  private pages: any[];
  private readonly context: Command.Context | Interaction.InteractionContext;
  private readonly target: string[];

  constructor(
    ctx: Command.Context | Interaction.InteractionContext,
    options: PaginatorOptions
  ) {
    this.context = ctx;

    this.pages = options.pages;
    this.maximumPages = Math.max(
      Math.min(options.maximumPages || this.pages.length, this.pages.length),
      0
    );
    this.onEmbed = options.onEmbed.bind(this);

    if (options.onKill) this.onKill = options.onKill.bind(this);
    else this.onKill = () => void 0;

    if (options.target) this.target = options.target;
    else this.target = [ctx.userId];

    if (options.message) this.message = options.message;
  }

  private get channelId() {
    return this.context.channelId;
  }

  private async getMessageObject() {
    const messageObject:
      | RequestTypes.CreateMessage
      | Structures.InteractionEditOrRespond = {
      components: [],
      embed: await this.getEmbed(),
    };
    if (!this.dead) messageObject.components = this.components;
    return messageObject;
  }

  private get components() {
    const components = new Utils.Components({
      timeout: EXPIRATION,
      onTimeout: this.kill.bind(this),
      run: this.run.bind(this),
    });

    components.addButton({
      customId: PageButtonIDs.FIRST,
      disabled: this.currentPage === 0,
      ...PageButtons[PageButtonIDs.FIRST],
    });

    components.addButton({
      customId: PageButtonIDs.PREVIOUS,
      disabled: this.currentPage - 1 === -1,
      ...PageButtons[PageButtonIDs.PREVIOUS],
    });

    components.addButton({
      customId: PageButtonIDs.NEXT,
      disabled: this.currentPage + 1 === this.pages.length,
      ...PageButtons[PageButtonIDs.NEXT],
    });

    components.addButton({
      customId: PageButtonIDs.LAST,
      disabled: this.currentPage === this.pages.length - 1,
      ...PageButtons[PageButtonIDs.LAST],
    });

    components.addButton({
      customId: PageButtonIDs.STOP,
      ...PageButtons[PageButtonIDs.STOP],
    });

    return components;
  }

  private async run(ctx: Utils.ComponentContext) {
    const time = Date.now();
    if (
      time - this.lastRan < RATE_LIMIT ||
      this.target.indexOf(ctx.userId) === -1
    )
      return ctx.respond(
        DetritusConstants.InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE
      );

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
    ctx.editOrRespond(await this.getMessageObject());
  }

  public async start() {
    const message = await this.getMessageObject();
    if (this.message) {
      await this.message.edit(message);
    } else {
      if (this.context instanceof Command.Context)
        this.message = await this.context.reply(message);
      else
        this.message = (await this.context.editOrRespond(
          message
        )) as Structures.Message;
    }
  }

  private async getEmbed() {
    const embed = new Utils.Embed({
      title: await t(
        this.context.guild as any,
        'page',
        this.currentPage + 1,
        this.maximumPages
      ),
      color: Constants.EMBED_COLORS.DEFAULT,
    });

    if (this.onEmbed) this.onEmbed(this.pages[this.currentPage], embed);

    return embed;
  }

  public async kill() {
    if (this.dead) return;
    this.dead = true;
    this.onKill();

    const message = await this.getMessageObject();
    if (this.context instanceof Interaction.InteractionContext)
      this.context.editOrRespond(message);
    else this.message.edit(message);
  }
}
