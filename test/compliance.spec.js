/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-var-requires */
import { readdirSync, statSync, readFileSync } from 'fs';
import { basename } from 'path';
import { search } from '../src';

// Compliance tests that aren't supported yet.
const notImplementedYet = [];

function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

export const expectError = (action, expected) => {
  let result = null;
  let succeeded = false;

  const errorTypes = ['invalid-type', 'invalid-value', 'invalid-arity', 'not-a-number', 'syntax', 'unknown-function'];

  function makePattern(text, replaceHyphens = false) {
    let pattern = text;

    if (replaceHyphens) {
      errorTypes.map(errorType => {
        if (pattern.indexOf(errorType) != -1) {
          pattern = pattern.replace(errorType, errorType.replace('-', ' '));
        }
      });
    }

    pattern = pattern
      .replace(/\-/g, '\\-')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/\./g, '\\.')
      .replace(/\*/g, '\\*')
      .replace(/\^/g, '\\^');

    return pattern;
  }
  function getPattern(text) {
    const pattern = `(${makePattern(text)})|(${makePattern(text, true)})`;
    return new RegExp(pattern);
  }

  try {
    result = action();
    succeeded = true;
  } catch (err) {
    if (err instanceof Error) {
      if (Array.isArray(expected)) {
        expected.map(element => {
          expect(err.message).toMatch(getPattern(element));
        });
      } else {
        expect(err.message).toMatch(getPattern(expected));
      }
    }
  }

  if (succeeded) {
    throw new Error(`the action was expected to throw an error but returned '${JSON.stringify(result)}' instead`);
  }
}

function addTestSuitesFromFile(filename) {
  describe(filename, () => {
    const spec = JSON.parse(readFileSync(filename, 'utf-8'));
    for (let i = 0; i < spec.length; i++) {
      const msg = `suite ${i} for filename ${filename}`;
      describe(msg, () => {
        const given = spec[i].given;
        const cases = spec[i].cases.map(c => [c.expression, c.result, c.error]);

        test.each(cases)('should pass test %# %s', (expression, result, error) => {
          if (error !== undefined) {
            expect(() => search(given, expression)).toThrow(error);
          } else {
            expect(search(given, expression)).toEqual(result);
          }
        });
      });
    }
  });
}

const listing = readdirSync('test/compliance');
for (let i = 0; i < listing.length; i++) {
  const filename = 'test/compliance/' + listing[i];
  if (statSync(filename).isFile() && endsWith(filename, '.json') && !notImplementedYet.includes(basename(filename))) {
    addTestSuitesFromFile(filename);
  }
}
