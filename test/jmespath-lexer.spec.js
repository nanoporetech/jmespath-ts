import { tokenize } from '../src';

describe('tokenize', () => {
  it('should tokenize root node reference', () => {
    expect(tokenize('$')).toMatchObject([{ type: 'Root', value: '$', start: 0 }]);
  });
  it('should tokenize arithmetic + plus sign', () => {
    expect(tokenize('+')).toMatchObject([{ type: 'Plus', value: '+', start: 0 }]);
  });
  it('should tokenize arithmetic - minus sign', () => {
    expect(tokenize('-')).toMatchObject([{ type: 'Minus', value: '-', start: 0 }]);
  });
  it('should tokenize arithmetic − (U+2212) minus sign', () => {
    expect(tokenize('−')).toMatchObject([{ type: 'Minus', value: '\u2212', start: 0 }]);
  });
  it('should tokenize arithmetic × (U+00D7) multiplication sign', () => {
    expect(tokenize('×')).toMatchObject([{ type: 'Multiply', value: '\u00d7', start: 0 }]);
  });
  it('should tokenize arithmetic / division operator', () => {
    expect(tokenize('/')).toMatchObject([{ type: 'Divide', value: '/', start: 0 }]);
  });
  it('should tokenize arithmetic ÷ (U+00F7) division sign', () => {
    expect(tokenize('÷')).toMatchObject([{ type: 'Divide', value: '\u00f7', start: 0 }]);
  });
  it('should tokenize arithmetic % modulo operator', () => {
    expect(tokenize('%')).toMatchObject([{ type: 'Modulo', value: '%', start: 0 }]);
  });
  it('should tokenize arithmetic // integer division operator', () => {
    expect(tokenize('//')).toMatchObject([{ type: 'Div', value: '//', start: 0 }]);
  });
  it('should tokenize unquoted identifier', () => {
    expect(tokenize('foo')).toMatchObject([{ type: 'UnquotedIdentifier', value: 'foo', start: 0 }]);
  });
  it('should tokenize unquoted identifier with underscore', () => {
    expect(tokenize('_underscore')).toMatchObject([{ type: 'UnquotedIdentifier', value: '_underscore', start: 0 }]);
  });
  it('should tokenize unquoted identifier with numbers', () => {
    expect(tokenize('foo123')).toMatchObject([{ type: 'UnquotedIdentifier', value: 'foo123', start: 0 }]);
  });
  it('should tokenize dotted lookups', () => {
    expect(tokenize('foo.bar')).toMatchObject([
      { type: 'UnquotedIdentifier', value: 'foo', start: 0 },
      { type: 'Dot', value: '.', start: 3 },
      { type: 'UnquotedIdentifier', value: 'bar', start: 4 },
    ]);
  });
  it('should tokenize numbers', () => {
    expect(tokenize('foo[0]')).toMatchObject([
      { type: 'UnquotedIdentifier', value: 'foo', start: 0 },
      { type: 'Lbracket', value: '[', start: 3 },
      { type: 'Number', value: 0, start: 4 },
      { type: 'Rbracket', value: ']', start: 5 },
    ]);
  });
  it('should tokenize numbers with multiple digits', () => {
    expect(tokenize('12345')).toMatchObject([{ type: 'Number', value: 12345, start: 0 }]);
  });
  it('should tokenize negative numbers', () => {
    expect(tokenize('-12345')).toMatchObject([{ type: 'Number', value: -12345, start: 0 }]);
  });
  it('should tokenize quoted identifier', () => {
    expect(tokenize('"foo"')).toMatchObject([{ type: 'QuotedIdentifier', value: 'foo', start: 0 }]);
  });
  it('should tokenize quoted identifier with unicode escape', () => {
    expect(tokenize('"\\u2713"')).toMatchObject([{ type: 'QuotedIdentifier', value: '✓', start: 0 }]);
  });
  it('should tokenize literal lists', () => {
    expect(tokenize('`[0, 1]`')).toMatchObject([{ type: 'Literal', value: [0, 1], start: 0 }]);
  });
  it('should tokenize literal dict', () => {
    expect(tokenize('`{"foo": "bar"}`')).toMatchObject([{ type: 'Literal', value: { foo: 'bar' }, start: 0 }]);
  });
  it('should tokenize literal strings', () => {
    expect(tokenize('`"foo"`')).toMatchObject([{ type: 'Literal', value: 'foo', start: 0 }]);
  });
  it('should tokenize json literals', () => {
    expect(tokenize('`true`')).toMatchObject([{ type: 'Literal', value: true, start: 0 }]);
  });
  it('should not requiring surrounding quotes for strings', () => {
    expect(tokenize('`foo`')).toMatchObject([{ type: 'Literal', value: 'foo', start: 0 }]);
  });
  it('should not requiring surrounding quotes for numbers', () => {
    expect(tokenize('`20`')).toMatchObject([{ type: 'Literal', value: 20, start: 0 }]);
  });
  it('should tokenize literal lists with chars afterwards', () => {
    expect(tokenize('`[0, 1]`[0]')).toMatchObject([
      { type: 'Literal', value: [0, 1], start: 0 },
      { type: 'Lbracket', value: '[', start: 8 },
      { type: 'Number', value: 0, start: 9 },
      { type: 'Rbracket', value: ']', start: 10 },
    ]);
  });
  it('should tokenize two char tokens with shared prefix', () => {
    expect(tokenize('[?foo]')).toMatchObject([
      { type: 'Filter', value: '[?', start: 0 },
      { type: 'UnquotedIdentifier', value: 'foo', start: 2 },
      { type: 'Rbracket', value: ']', start: 5 },
    ]);
  });
  it('should tokenize flatten operator', () => {
    expect(tokenize('[]')).toMatchObject([{ type: 'Flatten', value: '[]', start: 0 }]);
  });
  it('should tokenize comparators', () => {
    expect(tokenize('<')).toMatchObject([{ type: 'LT', value: '<', start: 0 }]);
  });
  it('should tokenize two char tokens without shared prefix', () => {
    expect(tokenize('==')).toMatchObject([{ type: 'EQ', value: '==', start: 0 }]);
    expect(() => tokenize('=')).toThrowError('Unknown incomplete token: =');
  });
  it('should tokenize not equals', () => {
    expect(tokenize('!=')).toMatchObject([{ type: 'NE', value: '!=', start: 0 }]);
  });
  it('should tokenize the AND token', () => {
    expect(tokenize('&&')).toMatchObject([
      { type: 'And', value: '&&', start: 0 },
    ]);
    expect(tokenize('a&&b')).toMatchObject([
      { type: 'UnquotedIdentifier', value: 'a', start: 0 },
      { type: 'And', value: '&&', start: 1 },
      { type: 'UnquotedIdentifier', value: 'b', start: 3 },
    ]);
  });
  it('should tokenize the OR token', () => {
    expect(tokenize('||')).toMatchObject([
      { type: 'Or', value: '||', start: 0 },
    ]);
    expect(tokenize('a||b')).toMatchObject([
      { type: 'UnquotedIdentifier', value: 'a', start: 0 },
      { type: 'Or', value: '||', start: 1 },
      { type: 'UnquotedIdentifier', value: 'b', start: 3 },
    ]);
  });
  it('should tokenize function calls', () => {
    expect(tokenize('abs(@)')).toMatchObject([
      { type: 'UnquotedIdentifier', value: 'abs', start: 0 },
      { type: 'Lparen', value: '(', start: 3 },
      { type: 'Current', value: '@', start: 4 },
      { type: 'Rparen', value: ')', start: 5 },
    ]);
  });
});
