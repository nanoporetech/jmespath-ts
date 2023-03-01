import { compile } from '../src';

describe('parsing', () => {
  it('should parse field node', () => {
    expect(compile('foo')).toMatchObject({ type: 'Field', name: 'foo' });
  });
  it('should parse arithmetic addition', () => {
    expect(compile('foo + bar')).toMatchObject({
      type: 'Arithmetic',
      operator: 'Plus',
      children: [
        { type: 'Field', name: 'foo' },
        { type: 'Field', name: 'bar' },
      ],
    });
  });
  it('should parse arithmetic subtraction', () => {
    const expected = {
      type: 'Arithmetic',
      operator: 'Minus',
      children: [
        { type: 'Field', name: 'foo' },
        { type: 'Field', name: 'bar' },
      ],
    };
    expect(compile('foo - bar')).toMatchObject(expected);
    expect(compile('foo − bar')).toMatchObject(expected);
  });
  it('should parse arithmetic unary negation', () => {
    const expected = {
      type: 'Unary',
      operator: 'Minus',
      children: [{ type: 'Field', name: 'bar' }],
    };
    expect(compile('-bar')).toMatchObject(expected);
    expect(compile('\u2212bar')).toMatchObject(expected);
  });
});
