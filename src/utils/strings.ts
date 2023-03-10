export const lower = (subject: string): string => subject.toLowerCase();
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
