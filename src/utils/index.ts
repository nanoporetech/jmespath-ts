export const isObject = (obj: unknown): obj is Record<string, unknown> => {
  return obj !== null && Object.prototype.toString.call(obj) === '[object Object]';
};

export const strictDeepEqual = (first: unknown, second: unknown): boolean => {
  if (first === second) {
    return true;
  }
  if (typeof first !== typeof second) {
    return false;
  }
  if (Array.isArray(first) && Array.isArray(second)) {
    if (first.length !== second.length) {
      return false;
    }
    for (let i = 0; i < first.length; i += 1) {
      if (!strictDeepEqual(first[i], second[i])) {
        return false;
      }
    }
    return true;
  }
  if (isObject(first) && isObject(second)) {
    const firstEntries = Object.entries(first);
    const secondKeys = new Set(Object.keys(second));
    if (firstEntries.length !== secondKeys.size) {
      return false;
    }
    for (const [key, value] of firstEntries) {
      if (!strictDeepEqual(value, second[key])) {
        return false;
      }
      secondKeys.delete(key);
    }
    return secondKeys.size === 0;
  }
  return false;
};

export const isFalse = (obj: unknown): boolean => {
  if (obj === '' || obj === false || obj === null || obj === undefined) {
    return true;
  }
  if (Array.isArray(obj) && obj.length === 0) {
    return true;
  }
  if (isObject(obj)) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        return false;
      }
    }
    return true;
  }
  return false;
};

export const isAlpha = (ch: string): boolean => {
  // tslint:disable-next-line: strict-comparisons
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_';
};

export const isNum = (ch: string): boolean => {
  // tslint:disable-next-line: strict-comparisons
  return (ch >= '0' && ch <= '9') || ch === '-';
};
export const isAlphaNum = (ch: string): boolean => {
  // tslint:disable-next-line: strict-comparisons
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9') || ch === '_';
};
