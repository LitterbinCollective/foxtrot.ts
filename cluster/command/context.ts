import { Command, Interaction } from "detritus-client";

class UnifiedContext {
  public context: Interaction.InteractionContext | Command.Context;

  constructor(context: Interaction.InteractionContext | Command.Context) {
    this.context = context;
  }

  public get channel() {
    return this.context.channel;
  }

  public get guild() {
    return this.context.guild;
  }

  public get guildId() {
    return this.context.guildId;
  }

  public get members() {
    return this.context.members;
  }

  public get member() {
    return this.context.member;
  }

  public get user() {
    return this.context.user;
  }

  public get cluster() {
    return this.context.cluster;
  }

  public get client() {
    return this.context.client;
  }
}