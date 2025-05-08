import { readFileSync } from 'fs';

import * as constants from './constants';

export const Constants = constants;
export { default as Logger } from './logger';
export * from './functions';
export { default as UserError } from './user-error';

export const branch = readFileSync('./.git/HEAD', 'utf8')
  .trim().split('/').pop();