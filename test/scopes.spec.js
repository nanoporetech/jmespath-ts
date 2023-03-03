import { Scope } from '../src';

describe('scopes', () => {
  it('should return null on missing identifier', () => {
    const scope = Scope({});
    expect(scope.getValue('foo')).toEqual(null);
  });
  it('should return item from scope', () => {
    const scope = Scope({});
    {
      const outer = scope.withScope({ foo: 'bar' });
      expect(outer.getValue('foo')).toEqual('bar');
    }
  });
  it('should return item from nested scope', () => {
    const scope = Scope({});
    {
      const outer = scope.withScope({ foo: 'bar', qux: 'quux' });
      {
        const inner = outer.withScope({ foo: 'baz' });
        expect(inner.getValue('foo')).toEqual('baz');
        expect(inner.getValue('qux')).toEqual('quux');
      }
      expect(outer.getValue('foo')).toEqual('bar');
    }
  });
});
