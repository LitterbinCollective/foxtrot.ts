import { Constants as DetritusConstants, Structures, Utils } from 'detritus-client';
import * as Sentry from '@sentry/node';

import { branch, Constants, gitCommit } from '@/utils';
import app from '@cluster/index';
import { t } from '@cluster/managers/i18n';
import { defineDefaultSentryContext } from './functions';

const TIMEOUT_GLOBAL = 60000;

/**
const TIMEOUT_USER = 120000;
[...]
    let message = 'no message';
    let clicked = false;
    const components = new Utils.Components({
      timeout: 60000,
      onTimeout: () => !clicked && this.sendSentry(ctx.user, message),
      async run(ctx: Utils.ComponentContext) {
        if (!ctx.guild) return;
        clicked = true;

        const modal = new Utils.InteractionModal({
          onError: console.error,
          async run(ctx: Utils.InteractionModalContext, args: Utils.InteractionModalArgs) {
            if (!ctx.guild) return;
            message = args[0];
            this.sendSentry(ctx.user, message);

            await ctx.respond(DetritusConstants.InteractionCallbackTypes.UPDATE_MESSAGE, {
              content: await t(ctx.guild, 'feedback.thanks')
            });
          },
          title: await t(ctx.guild, 'feedback.modal.title'),
        });

        modal.createInputText({
          customId: 'feedback_details',
          label: await t(ctx.guild, 'feedback.modal.input'),
          placeholder: await t(ctx.guild, 'feedback.modal.placeholder'),
          style: DetritusConstants.MessageComponentInputTextStyles.PARAGRAPH,
          required: true
        });

        await ctx.respond(DetritusConstants.InteractionCallbackTypes.MODAL, modal);
      }
    });

    components.createTextDisplay({
      content: await t(this.guild, 'feedback.response')
    });

    const actionRow = components.createActionRow({});
    actionRow.createButton({
      customId: 'feedback_modal',
      label: await t(this.guild, 'feedback.button'),
      style: DetritusConstants.MessageComponentButtonStyles.PRIMARY
    });

*/

export default class Feedback {
  public createdAt = Date.now();
  private channel: Structures.ChannelTextType;
  private message?: Structures.Message;
  private users: string[] = [];

  constructor(channel: Structures.ChannelTextType) {
    this.channel = channel;

    this.respondToUser = this.respondToUser.bind(this);
    this.kill = this.kill.bind(this);
    this.createEntryPoint();
  }

  private get guild() {
    if (!this.channel.guild)
      throw new Error('not supposed to happen');
    return this.channel.guild;
  }

  private async createEntryPoint() {
    const components = new Utils.Components({
      timeout: TIMEOUT_GLOBAL,
      run: this.respondToUser,
      onTimeout: this.kill,
    });

    const container = components.createContainer({
      accentColor: Constants.EMBED_COLORS.DEFAULT,
    });

    container.createTextDisplay({
      content: [
        '#',
        app.emoji('YAY'),
        await t(this.guild, 'feedback.title')
      ].join(' ')
    });

    container.createMediaGallery({
      items: [
        {
          media: { url: 'https://wicopee.drm.gdn/xr1RM24ltS.png' }
        }
      ]
    });

    container.createTextDisplay({
      content: await t(this.guild, 'feedback.description', branch, Constants.APPLICATION_NAME)
    });

    container.createSeparator();

    container.createTextDisplay({
      content: await t(this.guild, 'feedback.pre-button', Constants.APPLICATION_NAME)
    });

    const actionRow = container.createActionRow({});
    for (let i = 0; i < 5; i++)
      actionRow.createButton({
        customId: `feedback_${i}`,
        label: await t(this.guild, `feedback.grade.${i + 1}`),
        style: (i === 0 || i === 4) ?
          DetritusConstants.MessageComponentButtonStyles.PRIMARY :
          DetritusConstants.MessageComponentButtonStyles.SECONDARY,
      });

    this.message = await this.channel.createMessage({ components });
  }

  private async respondToUser(ctx: Utils.ComponentContext) {
    const user = ctx.user;
    if (this.users.includes(user.id))
      return;
    this.users.push(user.id);

    await ctx.respond(DetritusConstants.InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, {
      flags: DetritusConstants.MessageFlags.EPHEMERAL,
    });

    this.sendSentry(user, ctx.customId.split('_')[1], 'tak nazyvaemaya zaglushka epty');
    await ctx.editOrRespond({
      flags: DetritusConstants.MessageFlags.EPHEMERAL,
      content: await t(this.guild, 'feedback.thanks', user.username),
    });
  }

  private sendSentry(user: Structures.User, rating: string, message: string) {
    Sentry.withScope(scope => {
      defineDefaultSentryContext({
        user,
        guild: this.guild,
        channel: this.channel,
        shardId: this.channel.shardId,
      }, scope);

      Sentry.captureFeedback({
        message: 'rated ' + rating + '\n\n' + message,
        name: user.username,
        url: 'https://discord.com/users/' + user.id,
        tags: {
          rating,
          gitCommit: gitCommit,
          branch: branch,
          guildId: this.guild.id,
        }
      });
    });
  }

  private kill() {
    return this.message?.delete();
  }
}