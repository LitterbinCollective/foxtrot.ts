import { Structures } from 'detritus-client';

import { t } from '@clu/managers/i18n';

export class UserError extends Error {
  public formatValues: any[];

  constructor(message?: string, ...values: any[]) {
    super(message);
    this.formatValues = values;
  }

  translate(guild: Structures.Guild) {
    return t(guild, this.message, ...this.formatValues);
  }
}
