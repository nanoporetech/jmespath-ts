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

export function expectError(action, expected) {
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

    pattern = text
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
    return new RegExp(pattern, "i");
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


function addTestSuitesFromFile(filename, options) {
  options = options || {};
  describe(filename, () => {
    const spec = JSON.parse(readFileSync(filename, 'utf-8'));
    for (let i = 0; i < spec.length; i++) {
      const msg = `suite ${i} for filename ${filename}`;
      describe(msg, () => {
        const given = spec[i].given;
        const cases = spec[i].cases.map(c => [c.expression, c.result, c.error]);

        test.each(cases)('should pass test %# %s', (expression, result, error) => {
          if (error !== undefined) {
            expectError(
              () => search(given, expression, options),
              error
              );
          } else {
            expect(search(given, expression, options)).toEqual(result);
          }
        });
      });
    }
  });
}

function getFileList(dirName) {
  let files = [];
  const items = readdirSync(dirName, { withFileTypes: true, });
  for (const item of items){
    const itemName = `${dirName}/${item.name}`;
    if (item.isDirectory()) {
      files = [
        ...files,
        ...getFileList(itemName),
      ];
    } else {
      if (item.name.endsWith('.json') && !notImplementedYet.includes(basename(item.name))) {
        files.push(itemName);
      }
    }
  }

  return files;
}

const listing = getFileList('test/compliance');
for (let i = 0; i < listing.length; i++) {
  let options = {};
  if (basename(listing[i]) === 'legacy-literal.json'){
    options.enable_legacy_literals = true;
  }
  addTestSuitesFromFile(listing[i], options);
}
