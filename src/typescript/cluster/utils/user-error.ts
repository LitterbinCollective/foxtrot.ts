export default class UserError extends Error {
  public formatValues: any[];

  constructor(message?: string, ...values: any[]) {
    super(message);
    this.formatValues = values;
  }
}