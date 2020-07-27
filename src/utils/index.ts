import { JSONValue, JSONArray, JSONObject } from '../';

export const isObject = (obj: JSONValue): boolean => {
  return obj !== null && Object.prototype.toString.call(obj) === '[object Object]';
};

export const strictDeepEqual = (first: JSONValue, second: JSONValue): boolean => {
  if (first === second) {
    return true;
  }
  const firstType = Object.prototype.toString.call(first);
  if (firstType !== Object.prototype.toString.call(second)) {
    return false;
  }
  if (Array.isArray(first)) {
    if (first.length !== (second as JSONArray).length) {
      return false;
    }
    for (let i = 0; i < first.length; i += 1) {
      if (!strictDeepEqual(first[i], (second as JSONArray)[i])) {
        return false;
      }
    }
    return true;
  }
  if (isObject(first as JSONValue)) {
    const keysSeen = {};
    for (const key in first as JSONObject) {
      if (Object.hasOwnProperty.call(first, key)) {
        if (!strictDeepEqual((first as JSONObject)[key], (second as JSONObject)[key])) {
          return false;
        }
        keysSeen[key] = true;
      }
    }
    for (const key2 in second as JSONObject) {
      if (Object.hasOwnProperty.call(second, key2)) {
        if (keysSeen[key2] !== true) {
          return false;
        }
      }
    }
    return true;
  }
  return false;
};

export const isFalse = (obj: JSONValue): boolean => {
  if (obj === '' || obj === false || obj === null || obj === undefined) {
    return true;
  }
  if (Array.isArray(obj) && obj.length === 0) {
    return true;
  }
  if (isObject(obj as JSONValue)) {
    for (const key in obj as JSONObject) {
      if ((obj as JSONObject).hasOwnProperty(key)) {
        return false;
      }
    }
    return true;
  }
  return false;
};

export const trimLeft: (str: string) => string =
  typeof String.prototype.trimLeft === 'function'
    ? (str: string): string => {
        return str.trimLeft();
      }
    : (str: string): string => {
        const match = /^\s*(.*)/.exec(str);
        return (match && match[1]) as string;
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
