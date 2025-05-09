import UserError from './user-error';

export function convertToType(value: any, type: string) {
  switch (type) {
    case 'string':
      value = value.toString();
      break;
    case 'PgInteger':
    case 'integer':
    case 'number':
      value = +value;
      if (type === 'integer' || type === 'PgInteger') {
        value = Math.floor(value);
        type = 'number'; // let's also set this so sanity check would work
      }
      if (isNaN(value)) throw new UserError('invalid-number');
      break;
    case 'PgBoolean':
    case 'boolean':
      value = !(
        value === undefined ||
        value === false ||
        value === 0 ||
        value === '0' ||
        value === 'false' ||
        value === 'off'
      );
      type = 'boolean'; // let's also set this so sanity check would work
      break;
    case 'undefined':
      value = undefined;
      break;
    default:
      throw new Error('could not convert given value to needed type! ' + type);
  }

  // safety check
  const type2 = typeof value;
  if (type !== type2)
    throw new Error(
      'the type of value is not equal to the type of a specified type: ' +
        type2 +
        ' !== ' +
        type
    );

  return value;
}