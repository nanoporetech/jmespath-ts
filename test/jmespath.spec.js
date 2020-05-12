import jmespath, { search, tokenize, compile, registerFunction } from '../src';
import { strictDeepEqual } from '../src/utils';

describe('tokenize', () =>  {
  it('should tokenize unquoted identifier', () =>  {
    expect(tokenize('foo')).toMatchObject([{ type: 'UnquotedIdentifier', value: 'foo', start: 0 }]);
  });
  it('should tokenize unquoted identifier with underscore', () =>  {
    expect(tokenize('_underscore')).toMatchObject([{ type: 'UnquotedIdentifier', value: '_underscore', start: 0 }]);
  });
  it('should tokenize unquoted identifier with numbers', () =>  {
    expect(tokenize('foo123')).toMatchObject([{ type: 'UnquotedIdentifier', value: 'foo123', start: 0 }]);
  });
  it('should tokenize dotted lookups', () =>  {
    expect(tokenize('foo.bar')).toMatchObject([
      { type: 'UnquotedIdentifier', value: 'foo', start: 0 },
      { type: 'Dot', value: '.', start: 3 },
      { type: 'UnquotedIdentifier', value: 'bar', start: 4 },
    ]);
  });
  it('should tokenize numbers', () =>  {
    expect(tokenize('foo[0]')).toMatchObject([
      { type: 'UnquotedIdentifier', value: 'foo', start: 0 },
      { type: 'Lbracket', value: '[', start: 3 },
      { type: 'Number', value: 0, start: 4 },
      { type: 'Rbracket', value: ']', start: 5 },
    ]);
  });
  it('should tokenize numbers with multiple digits', () =>  {
    expect(tokenize('12345')).toMatchObject([{ type: 'Number', value: 12345, start: 0 }]);
  });
  it('should tokenize negative numbers', () =>  {
    expect(tokenize('-12345')).toMatchObject([{ type: 'Number', value: -12345, start: 0 }]);
  });
  it('should tokenize quoted identifier', () =>  {
    expect(tokenize('"foo"')).toMatchObject([{ type: 'QuotedIdentifier', value: 'foo', start: 0 }]);
  });
  it('should tokenize quoted identifier with unicode escape', () =>  {
    expect(tokenize('"\\u2713"')).toMatchObject([{ type: 'QuotedIdentifier', value: '✓', start: 0 }]);
  });
  it('should tokenize literal lists', () =>  {
    expect(tokenize('`[0, 1]`')).toMatchObject([{ type: 'Literal', value: [0, 1], start: 0 }]);
  });
  it('should tokenize literal dict', () =>  {
    expect(tokenize('`{"foo": "bar"}`')).toMatchObject([{ type: 'Literal', value: { foo: 'bar' }, start: 0 }]);
  });
  it('should tokenize literal strings', () =>  {
    expect(tokenize('`"foo"`')).toMatchObject([{ type: 'Literal', value: 'foo', start: 0 }]);
  });
  it('should tokenize json literals', () =>  {
    expect(tokenize('`true`')).toMatchObject([{ type: 'Literal', value: true, start: 0 }]);
  });
  it('should not requiring surrounding quotes for strings', () =>  {
    expect(tokenize('`foo`')).toMatchObject([{ type: 'Literal', value: 'foo', start: 0 }]);
  });
  it('should not requiring surrounding quotes for numbers', () =>  {
    expect(tokenize('`20`')).toMatchObject([{ type: 'Literal', value: 20, start: 0 }]);
  });
  it('should tokenize literal lists with chars afterwards', () =>  {
    expect(tokenize('`[0, 1]`[0]')).toMatchObject([
      { type: 'Literal', value: [0, 1], start: 0 },
      { type: 'Lbracket', value: '[', start: 8 },
      { type: 'Number', value: 0, start: 9 },
      { type: 'Rbracket', value: ']', start: 10 },
    ]);
  });
  it('should tokenize two char tokens with shared prefix', () =>  {
    expect(tokenize('[?foo]')).toMatchObject([
      { type: 'Filter', value: '[?', start: 0 },
      { type: 'UnquotedIdentifier', value: 'foo', start: 2 },
      { type: 'Rbracket', value: ']', start: 5 },
    ]);
  });
  it('should tokenize flatten operator', () =>  {
    expect(tokenize('[]')).toMatchObject([{ type: 'Flatten', value: '[]', start: 0 }]);
  });
  it('should tokenize comparators', () =>  {
    expect(tokenize('<')).toMatchObject([{ type: 'LT', value: '<', start: 0 }]);
  });
  it('should tokenize two char tokens without shared prefix', () =>  {
    expect(tokenize('==')).toMatchObject([{ type: 'EQ', value: '==', start: 0 }]);
  });
  it('should tokenize not equals', () =>  {
    expect(tokenize('!=')).toMatchObject([{ type: 'NE', value: '!=', start: 0 }]);
  });
  it('should tokenize the OR token', () =>  {
    expect(tokenize('a||b')).toMatchObject([
      { type: 'UnquotedIdentifier', value: 'a', start: 0 },
      { type: 'Or', value: '||', start: 1 },
      { type: 'UnquotedIdentifier', value: 'b', start: 3 },
    ]);
  });
  it('should tokenize function calls', () =>  {
    expect(tokenize('abs(@)')).toMatchObject([
      { type: 'UnquotedIdentifier', value: 'abs', start: 0 },
      { type: 'Lparen', value: '(', start: 3 },
      { type: 'Current', value: '@', start: 4 },
      { type: 'Rparen', value: ')', start: 5 },
    ]);
  });
});

describe('parsing', () =>  {
  it('should parse field node', () =>  {
    expect(compile('foo')).toMatchObject({ type: 'Field', name: 'foo' });
  });
});

describe('strictDeepEqual', () =>  {
  it('should compare scalars', () =>  {
    expect(strictDeepEqual('a', 'a')).toStrictEqual(true);
  });
  it('should be false for different types', () =>  {
    expect(strictDeepEqual('a', 2)).toStrictEqual(false);
  });
  it('should be false for arrays of different lengths', () =>  {
    expect(strictDeepEqual([0, 1], [1, 2, 3])).toStrictEqual(false);
  });
  it('should be true for identical arrays', () =>  {
    expect(strictDeepEqual([0, 1], [0, 1])).toStrictEqual(true);
  });
  it('should be true for nested arrays', () =>  {
    expect(
      strictDeepEqual(
        [
          [0, 1],
          [2, 3],
        ],
        [
          [0, 1],
          [2, 3],
        ],
      )).toStrictEqual(true);
  });
  it('should be true for nested arrays of strings', () =>  {
    expect(
      strictDeepEqual(
        [
          ['a', 'b'],
          ['c', 'd'],
        ],
        [
          ['a', 'b'],
          ['c', 'd'],
        ],
      )).toStrictEqual(true);
  });
  it('should be false for different arrays of the same length', () =>  {
    expect(strictDeepEqual([0, 1], [1, 2])).toStrictEqual(false);
  });
  it('should handle object literals', () =>  {
    expect(strictDeepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toStrictEqual(true);
  });
  it('should handle keys in first not in second', () =>  {
    expect(strictDeepEqual({ a: 1, b: 2 }, { a: 1 })).toStrictEqual(false);
  });
  it('should handle keys in second not in first', () =>  {
    expect(strictDeepEqual({ a: 1 }, { a: 1, b: 2 })).toStrictEqual(false);
  });
  it('should handle nested objects', () =>  {
    expect(strictDeepEqual({ a: { b: [1, 2] } }, { a: { b: [1, 2] } })).toStrictEqual(true);
  });
  it('should handle nested objects that are not equal', () =>  {
    expect(strictDeepEqual({ a: { b: [1, 2] } }, { a: { b: [1, 4] } })).toStrictEqual(false);
  });
});

describe('search', () =>  {
  it('should throw a readable error when invalid arguments are provided to a function', () =>  {
    try {
      search([], 'length(`null`)')
    } catch (e) {
      expect(e.message).toContain('length() expected argument 1 to be type (string | array | object)');
      expect(e.message).toContain('received type null instead.');
    }
  });
});

describe('registerFunction', () =>  {
  it('register a customFunction', () =>  {
      expect(() => search({
        foo: 60,
        bar: 10
      }, 'divide(foo, bar)')
      ).toThrow('Unknown function: divide()');
      jmespath.registerFunction('divide', (resolvedArgs) => {
          const [dividend, divisor] = resolvedArgs;
          return dividend / divisor;
        },
        [{ types: [jmespath.TYPE_NUMBER] }, { types: [jmespath.TYPE_NUMBER] }]
      )
      expect(() => search({
        foo: 60,
        bar: 10
      }, 'divide(foo, bar)')
      ).not.toThrow()
      expect(search({
        foo: 60,
        bar: 10
      }, 'divide(foo, bar)')
      ).toEqual(6)
  });
  it('won\'t register a customFunction if one already exists', () =>  {
      expect(() => registerFunction('sum', () => {}, [])
      ).toThrow('Function already defined: sum()');
  });
});

