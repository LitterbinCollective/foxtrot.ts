import { BaseEvent } from './baseevent';

export default class BirthdayEvent extends BaseEvent {
  public static timeRange = ['14/06', '21/06'];

  constructor() {
    super();

    this.editAvatar('avatar-birthday.png');
  }

  public cleanUp(): void {
    this.editAvatar('avatar.png');
  }
}