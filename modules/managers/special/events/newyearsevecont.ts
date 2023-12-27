import NewYearsEveEvent from './newyearseve';

export default class NewYearsEveContEvent extends NewYearsEveEvent {
  public static timeRange = ['01/01', '02/01'];

  public cleanUp(): void {
    super.cleanUp();
    this.editAvatar('avatar.png');
  }
}
