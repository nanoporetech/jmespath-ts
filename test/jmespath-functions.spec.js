import { expectError } from './compliance.spec';
import { search } from '../src';

describe('Evaluates functions', () => {
  it('pad_left()', () => { // this should be included in the compliance test suite
    expect(search('', 'pad_left(@, `10`)')).toEqual('');
  });
  it('pad_right()', () => { // this should be included in the compliance test suite
    expect(search('', 'pad_right(@, `10`)')).toEqual('');
  });
});

describe('Type-checks function arguments', () => {
  it('find_last()', () => { // this should be included in the compliance test suite
    expectError(() => {
      return search('subject string', "find_last(@, 's', `1.3`)");
    }, 'invalid-value');
  });
  it('pad_right()', () => { // this should be included in the compliance test suite
    expectError(() => {
      return search('subject string', "pad_right(@, `1`, '--')");
    }, 'invalid-value');
  });
});
