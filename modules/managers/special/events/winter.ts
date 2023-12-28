import { BaseEvent } from './baseevent';

export default class WinterEvent extends BaseEvent {
  public static timeRange = ['01/12', '30/12'];

  constructor() {
    super();

    this.editAvatar('avatar-winter.png');
  }

  public cleanUp(): void {
    this.editAvatar('avatar.png');
  }
}