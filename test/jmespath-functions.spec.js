import { expectError } from './compliance.spec';
import { search } from '../src';

describe('Type-checks function arguments', () => {
  it('find_last()', () => {
    expectError(() => {
      return search('subject string', "find_last(@, 's', `1.3`)");
    }, 'invalid-value');
  });
});