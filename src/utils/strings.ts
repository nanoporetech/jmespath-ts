import { ensureInteger, ensurePositiveInteger } from '.';

export const findFirst = (subject: string, sub: string, start?: number, end?: number): number | null => {
  if (!subject || !sub) {
    return null;
  }
  start = Math.max(ensureInteger((start = start || 0)), 0);
  end = Math.min(ensureInteger((end = end || subject.length)), subject.length);
  const offset = subject.slice(start, end).indexOf(sub);
  return offset === -1 ? null : offset + start;
};
export const findLast = (subject: string, sub: string, start?: number, end?: number): number | null => {
  if (!subject || !sub) {
    return null;
  }
  start = Math.max(ensureInteger((start = start || 0)), 0);
  end = Math.min(ensureInteger((end = end || subject.length)), subject.length);
  const offset = subject.slice(start, end).lastIndexOf(sub);
  const result = offset === -1 ? null : offset + start;
  return result;
};
export const lower = (subject: string): string => subject.toLowerCase();
export const replace = (subject: string, string: string, by: string, count?: number): string => {
  if (count === 0) {
    return subject;
  }
  if (!count) {
    // emulating es2021: String.prototype.replaceAll()
    return subject.split(string).join(by);
  }
  ensurePositiveInteger(count);
  [...Array(count).keys()].map(() => (subject = subject.replace(string, by)));
  return subject;
};
export const trim = (subject: string, chars?: string): string => {
  return trimLeft(trimRight(subject, chars), chars);
};
export const trimLeft = (subject: string, chars?: string): string => {
  return trimImpl(subject, list => new RegExp(`^[${list}]*(.*?)`), chars);
};
export const trimRight = (subject: string, chars?: string): string => {
  return trimImpl(subject, list => new RegExp(`(.*?)[${list}]*\$`), chars);
};
const trimImpl = (subject: string, regExper: (arg: string) => RegExp, chars?: string): string => {
  const pattern = chars ? chars.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') : '\\s\u0085';
  return subject.replace(regExper(pattern), '$1');
};

export const upper = (subject: string): string => subject.toUpperCase();
