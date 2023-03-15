import { search, registerFunction, TYPE_NUMBER, TYPE_ANY } from '../src';

describe('registerFunction', () => {
  it('register a customFunction', () => {
    expect(() =>
      search(
        {
          foo: 60,
          bar: 10,
        },
        'divide(foo, bar)',
      ),
    ).toThrow('Unknown function: divide()');
    registerFunction(
      'divide',
      resolvedArgs => {
        const [dividend, divisor] = resolvedArgs;
        return dividend / divisor;
      },
      [{ types: [TYPE_NUMBER] }, { types: [TYPE_NUMBER] }],
    );
    expect(() =>
      search(
        {
          foo: 60,
          bar: 10,
        },
        'divide(foo, bar)',
      ),
    ).not.toThrow();
    expect(
      search(
        {
          foo: 60,
          bar: 10,
        },
        'divide(foo, bar)',
      ),
    ).toEqual(6);
  });
  it("won't register a customFunction if one already exists", () => {
    expect(() =>
      registerFunction(
        'sum',
        () => {
          /* EMPTY FUNCTION */
        },
        [],
      ),
    ).toThrow('Function already defined: sum()');
  });
  it('alerts too few arguments', () => {
    registerFunction(
      'tooFewArgs',
      () => {
        /* EMPTY FUNCTION */
      },
      [{ types: [TYPE_ANY] }, { types: [TYPE_NUMBER], optional: true }],
    );
    expect(() =>
      search(
        {
          foo: 60,
          bar: 10,
        },
        'tooFewArgs()',
      ),
    ).toThrow('ArgumentError: tooFewArgs() takes 1 arguments but received 0');
    expect(() =>
      search(
        {
          foo: 60,
          bar: 10,
        },
        'tooFewArgs(foo, @)',
      ),
    ).toThrow('TypeError: tooFewArgs() expected argument 2 to be type (number) but received type object instead.');
    expect(() =>
      search(
        {
          foo: 60,
          bar: 10,
        },
        'tooFewArgs(foo, `2`, @)',
      ),
    ).toThrow('ArgumentError: tooFewArgs() takes 1 arguments but received 3');
  });
  it('alerts too many arguments', () => {
    registerFunction(
      'tooManyArgs',
      () => {
        /* EMPTY FUNCTION */
      },
      [],
    );
    expect(() =>
      search(
        {
          foo: 60,
          bar: 10,
        },
        'tooManyArgs(foo)',
      ),
    ).toThrow('ArgumentError: tooManyArgs() takes 0 argument but received 1');
  });

  it('alerts optional variadic arguments', () => {
    registerFunction(
      'optionalVariadic',
      () => {
        /* EMPTY FUNCTION */
      },
      [{ types: [TYPE_ANY], optional: true, variadic: true }],
    );
    expect(() =>
      search(
        {
          foo: 60,
          bar: 10,
        },
        'optionalVariadic(foo)',
      ),
    ).not.toThrow();
  });

  it('alerts variadic is always last argument', () => {
    registerFunction(
      'variadicAlwaysLast',
      () => {
        /* EMPTY FUNCTION */
      },
      [
        { types: [TYPE_ANY], variadic: true },
        { types: [TYPE_ANY], optional: true },
      ],
    );
    expect(() =>
      search(
        {
          foo: 60,
          bar: 10,
        },
        'variadicAlwaysLast(foo)',
      ),
    ).toThrow("ArgumentError: variadicAlwaysLast() 'variadic' argument 1 must occur last");
  });

  it('accounts for optional arguments', () => {
    registerFunction(
      'optionalArgs',
      ([first, second, third]) => {
        return { first, second: second ?? 'default[2]', third: third ?? 'default[3]' };
      },
      [{ types: [TYPE_ANY] }, { types: [TYPE_ANY], optional: true }],
    );
    expect(
      search(
        {
          foo: 60,
          bar: 10,
        },
        'optionalArgs(foo)',
      ),
    ).toEqual({ first: 60, second: 'default[2]', third: 'default[3]' });
    expect(
      search(
        {
          foo: 60,
          bar: 10,
        },
        'optionalArgs(foo, bar)',
      ),
    ).toEqual({ first: 60, second: 10, third: 'default[3]' });
    expect(() =>
      search(
        {
          foo: 60,
          bar: 10,
        },
        'optionalArgs(foo, bar, [foo, bar])',
      ),
    ).toThrow('ArgumentError: optionalArgs() takes 1 arguments but received 3');
  });
});

describe('root', () => {
  it('$ should give access to the root value', () => {
    const value = search({ foo: { bar: 1 } }, 'foo.{ value: $.foo.bar }');
    expect(value.value).toBe(1);
  });
  it('$ should give access to the root value after pipe', () => {
    const value = search({ foo: { bar: 1 } }, 'foo | $.foo.bar');
    expect(value).toEqual(1);
  });
  it('$ should give access in expressions', () => {
    const value = search([{ foo: { bar: 1 } }, { foo: { bar: 99 } }], 'map(&foo.{boo: bar, root: $}, @)');
    expect(value).toEqual([
      { boo: 1, root: [{ foo: { bar: 1 } }, { foo: { bar: 99 } }] },
      { boo: 99, root: [{ foo: { bar: 1 } }, { foo: { bar: 99 } }] },
    ]);
  });
  it('$ can be used in parallel', () => {
    const value = search([{ foo: { bar: 1 } }, { foo: { bar: 99 } }], '[$[0].foo.bar, $[1].foo.bar]');
    expect(value).toEqual([1, 99]);
  });
});
