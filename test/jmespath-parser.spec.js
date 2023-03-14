import { compile } from '../src';

describe('parsing', () => {
  it('should fail to parse invalid slice expressions', () => {
    try {
      expect(compile('[:::]'));
    } catch (e) {
      expect(e.message).toMatch(/syntax/i);
      expect(e.message).toContain('too many colons in slice expression');
    }
  });
});
