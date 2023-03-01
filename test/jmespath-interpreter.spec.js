import { search, compile, TreeInterpreter } from '../src';
import { add, divide, strictDeepEqual } from '../src/utils';

describe('Searches compiled ast', () => {
  it('should evaluate sub-expression', () => {
    const ast = compile('foo.bar');
    expect(TreeInterpreter.search(ast, { foo: { bar: 'BAZ' } })).toEqual('BAZ');
  });
  it('should evaluate arithmetic addition', () => {
    expect(TreeInterpreter.search(compile('foo+bar'), { foo: 40, bar: 2 })).toEqual(42);
  });
  it('should evaluate arithmetic multiplication', () => {
    expect(TreeInterpreter.search(compile('foo\u00d7bar'), { foo: 40, bar: 2 })).toEqual(80);
    expect(TreeInterpreter.search(compile('foo*bar'), { foo: 40, bar: 2 })).toEqual(80);
  });
  it('should evaluate unary arithmetic expressions', () => {
    expect(TreeInterpreter.search(compile('\u2212 `3` - +`2`'), {})).toEqual(-5);
  });
});

describe('strictDeepEqual', () => {
  it('should compare scalars', () => {
    expect(strictDeepEqual('a', 'a')).toStrictEqual(true);
  });
  it('should be false for different types', () => {
    expect(strictDeepEqual('a', 2)).toStrictEqual(false);
  });
  it('should be false for arrays of different lengths', () => {
    expect(strictDeepEqual([0, 1], [1, 2, 3])).toStrictEqual(false);
  });
  it('should be true for identical arrays', () => {
    expect(strictDeepEqual([0, 1], [0, 1])).toStrictEqual(true);
  });
  it('should be true for nested arrays', () => {
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
      ),
    ).toStrictEqual(true);
  });
  it('should be true for nested arrays of strings', () => {
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
      ),
    ).toStrictEqual(true);
  });
  it('should be false for different arrays of the same length', () => {
    expect(strictDeepEqual([0, 1], [1, 2])).toStrictEqual(false);
  });
  it('should handle object literals', () => {
    expect(strictDeepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toStrictEqual(true);
  });
  it('should handle keys in first not in second', () => {
    expect(strictDeepEqual({ a: 1, b: 2 }, { a: 1 })).toStrictEqual(false);
  });
  it('should handle keys in second not in first', () => {
    expect(strictDeepEqual({ a: 1 }, { a: 1, b: 2 })).toStrictEqual(false);
  });
  it('should handle nested objects', () => {
    expect(strictDeepEqual({ a: { b: [1, 2] } }, { a: { b: [1, 2] } })).toStrictEqual(true);
  });
  it('should handle nested objects that are not equal', () => {
    expect(strictDeepEqual({ a: { b: [1, 2] } }, { a: { b: [1, 4] } })).toStrictEqual(false);
  });
});

describe('add', () => {
  it('should add two JSON numbers', () => {
    expect(add(40, 2)).toEqual(42);
  });
  it('should err while trying to add non JSON numbers', () => {
    try {
      add('one', 'two');
      expect('evaluation succeeded').toEqual('evaluation failed');
    } catch (e) {
      expect(e.message).toContain('not-a-number');
    }
  });
});
describe('divide', () => {
  it('should err while trying to divide by zero', () => {
    try {
      divide(0, 0);
      expect('evaluation succeeded').toEqual('evaluation failed');
    } catch (e) {
      expect(e.message).toContain('not-a-number: divide by zero');
    }
  });
});

describe('search', () => {
  it('should throw a readable error when invalid arguments are provided to a function', () => {
    try {
      search([], 'length(`null`)');
    } catch (e) {
      expect(e.message).toContain('length() expected argument 1 to be type (string | array | object)');
      expect(e.message).toContain('received type null instead.');
    }
  });
});
