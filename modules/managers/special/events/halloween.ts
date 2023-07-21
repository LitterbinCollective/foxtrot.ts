import { BaseEvent } from './baseevent';

export default class HalloweenEvent extends BaseEvent {
  public static timeRange = ['20/10', '31/10'];

  constructor() {
    super();

    this.editAvatar('avatar-halloween.png');
  }

  public cleanUp(): void {
    this.editAvatar('avatar.png');
  }
}