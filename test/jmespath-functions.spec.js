import { search } from '../src';

describe('Evaluates functions', () => {
  it('from_items()', () => {
    expect(
      search([], 'from_items(@)'))
      .toEqual({});
  });
  it('from_items()', () => {
    expect(
      search([['foo', 'bar'], ['baz', 'qux']], 'from_items(@)'))
      .toEqual({ foo: 'bar', baz: 'qux' });
  });
  it('items()', () => {
    expect(
        search({ foo: 'bar', baz: 'qux' }, 'items(@)'))
        .toEqual([['foo', 'bar'], ['baz', 'qux']]);
  });
  it('zip()', () => {
    expect(
      search([], 'zip(@)'))
      .toEqual([]);
  });
  it('zip()', () => {
    const input = {
      people: ['Monika', 'Alice'],
      country: ['Germany', 'USA', 'France' ]
    };
    expect(
        search(input, 'zip(people, country)'))
        .toEqual([['Monika', 'Germany'], ['Alice', 'USA']]);
  });
});

describe('Type-checks function arguments', () => {
  it('from_items()', () => {
    // TODO: must be "invalid-type"
    expectError(() => { search(null, 'from_items(@)'); }, ['TypeError', 'null']);
  });
  it('from_items()', () => {
    // TODO: must be "invalid-type"
    expectError(() => { search("foo", 'from_items(@)'); }, ['TypeError', 'string']);
  });
  it('from_items()', () => {
    expectError(() => { return search([[]], 'from_items(@)'); }, 'invalid-value');
  });
  it('from_items()', () => {
    expectError(() => { return search([[1, 'one']], 'from_items(@)'); }, 'invalid-value');
  });
});

function expectError(action, expected) {

    let result = undefined;
    let succeeded = false;

    function getPattern(text) {
      const pattern = `(${text})|(${text.replace('-', ' ')})`;
      return new RegExp(pattern);
    }

    try {
      result = action();
      succeeded = true;
    } catch (e) {
      if (Array.isArray(expected)) {
        expected.map((element) => {
          expect(e.message).toMatch(getPattern(element));
        });
      } else {
        expect(e.message).toMatch(getPattern(expected));
      }
    }
      
    if (succeeded) {
      throw `the action was expected to throw an error but returned '${JSON.stringify(result)}' instead`;
    }
}