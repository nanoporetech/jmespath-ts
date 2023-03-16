import { readdirSync, statSync, readFileSync } from 'fs';
import { basename } from 'path';
import { search } from '../src';

// Compliance tests that aren't supported yet.
const notImplementedYet = [];

function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
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
