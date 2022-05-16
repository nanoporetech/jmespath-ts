import { isFalse, isObject, strictDeepEqual } from './utils';
import { Runtime } from './Runtime';
import { ExpressionNode, ExpressionReference, SliceNode } from './AST.type';
import { JSONArray, JSONObject, JSONValue } from './JSON.type';
import { Token } from './Lexer.type';

export class TreeInterpreter {
  runtime: Runtime;
  private _rootValue: JSONValue | null = null;

  constructor() {
    this.runtime = new Runtime(this);
  }

  search(node: ExpressionNode, value: JSONValue): JSONValue {
    this._rootValue = value;
    return this.visit(node, value) as JSONValue;
  }

  visit(node: ExpressionNode, value: JSONValue | ExpressionNode): JSONValue | ExpressionNode | ExpressionReference {
    switch (node.type) {
      case 'Field': {
        if (value === null) {
          return null;
        }
        if (isObject(value)) {
          const field = value[node.name];
          if (field === undefined) {
            return null;
          }
          return field;
        }
        return null;
      }
      case 'IndexExpression':
      case 'Subexpression': {
        const { left, right } = node;
        return this.visit(right, this.visit(left, value));
      }
      case 'Index': {
        if (!Array.isArray(value)) {
          return null;
        }
        const index = node.value < 0 ? value.length + node.value : node.value;
        const result = value[index];
        if (result === undefined) {
          return null;
        }
        return result;
      }
      case 'Slice': {
        if (!Array.isArray(value)) {
          return null;
        }
        const { start, stop, step } = this.computeSliceParams(value.length, node);
        const result = [];

        if (step > 0) {
          for (let i = start; i < stop; i += step) {
            result.push(value[i]);
          }
        } else {
          for (let i = start; i > stop; i += step) {
            result.push(value[i]);
          }
        }
        return result;
      }
      case 'Projection': {
        const { left, right } = node;
        const base = this.visit(left, value);
        if (!Array.isArray(base)) {
          return null;
        }
        const collected: JSONArray = [];
        for (let i = 0; i < base.length; i += 1) {
          const current = this.visit(right, base[i]) as JSONValue;
          if (current !== null) {
            collected.push(current);
          }
        }
        return collected as JSONValue;
      }
      case 'ValueProjection': {
        const { left, right } = node;

        const base = this.visit(left, value);
        if (!isObject(base)) {
          return null;
        }
        const collected: JSONArray = [];
        const values = Object.values(base);
        for (let i = 0; i < values.length; i += 1) {
          const current = this.visit(right, values[i]) as JSONValue;
          if (current !== null) {
            collected.push(current);
          }
        }
        return collected;
      }
      case 'FilterProjection': {
        const { left, right, condition } = node;

        const base = this.visit(left, value);
        if (!Array.isArray(base)) {
          return null;
        }
        const filtered = [];
        const finalResults: JSONArray = [];
        for (let i = 0; i < base.length; i += 1) {
          const matched = this.visit(condition, base[i]);
          if (!isFalse(matched)) {
            filtered.push(base[i]);
          }
        }
        for (let j = 0; j < filtered.length; j += 1) {
          const current = this.visit(right, filtered[j]) as JSONValue;
          if (current !== null) {
            finalResults.push(current);
          }
        }
        return finalResults;
      }
      case 'Comparator': {
        const first = this.visit(node.left, value);
        const second = this.visit(node.right, value);
        switch (node.name) {
          case 'EQ':
            return strictDeepEqual(first, second);
          case 'NE':
            return !strictDeepEqual(first, second);
          case 'GT':
            return (first as number) > (second as number);
          case 'GTE':
            return (first as number) >= (second as number);
          case 'LT':
            return (first as number) < (second as number);
          case 'LTE':
            return (first as number) <= (second as number);
        }
      }
      case 'Flatten': {
        const original = this.visit(node.child, value);
        if (!Array.isArray(original)) {
          return null;
        }
        let merged: JSONArray = [];
        for (let i = 0; i < original.length; i += 1) {
          const current = original[i];
          if (Array.isArray(current)) {
            merged = [...merged, ...current];
          } else {
            merged.push(current);
          }
        }
        return merged;
      }
      case 'Root':
        return this._rootValue;
      case 'MultiSelectList': {
        if (value === null) {
          return null;
        }
        const collected: JSONArray = [];
        for (let i = 0; i < node.children.length; i += 1) {
          collected.push(this.visit(node.children[i], value) as JSONValue);
        }
        return collected;
      }
      case 'MultiSelectHash': {
        if (value === null) {
          return null;
        }
        const collected: JSONObject = {};
        for (let i = 0; i < node.children.length; i += 1) {
          const child = node.children[i];
          collected[child.name] = this.visit(child.value, value) as JSONValue;
        }
        return collected;
      }
      case 'OrExpression': {
        const { left, right } = node;
        let matched = this.visit(left, value);
        if (isFalse(matched)) {
          matched = this.visit(right, value);
        }
        return matched;
      }
      case 'AndExpression': {
        const { left, right } = node;

        const first = this.visit(left, value);

        if (isFalse(first)) {
          return first;
        }
        return this.visit(right, value);
      }
      case 'NotExpression':
        return isFalse(this.visit(node.child, value));
      case 'Literal':
        return node.value;
      case 'Pipe':
        return this.visit(node.right, this.visit(node.left, value));
      case 'Function':
        const resolvedArgs: JSONArray = [];
        for (let j = 0; j < node.children.length; j += 1) {
          resolvedArgs.push(this.visit(node.children[j], value) as JSONValue);
        }
        return this.runtime.callFunction(node.name, resolvedArgs);
      case 'ExpressionReference':
        const refNode = node.child;
        return {
          jmespathType: Token.TOK_EXPREF,
          ...refNode,
        };
      case 'Current':
      case 'Identity':
        return value;
    }
  }

  computeSliceParams(arrayLength: number, sliceNode: SliceNode): { start: number; stop: number; step: number } {
    let { start, stop, step } = sliceNode;

    if (step === null) {
      step = 1;
    } else if (step === 0) {
      const error = new Error('Invalid slice, step cannot be 0');
      error.name = 'RuntimeError';
      throw error;
    }

    start = start === null ? (step < 0 ? arrayLength - 1 : 0) : this.capSliceRange(arrayLength, start, step);
    stop = stop === null ? (step < 0 ? -1 : arrayLength) : this.capSliceRange(arrayLength, stop, step);

    return { start, stop, step };
  }

  capSliceRange(arrayLength: number, actualValue: number, step: number): number {
    let nextActualValue = actualValue;
    if (nextActualValue < 0) {
      nextActualValue += arrayLength;
      if (nextActualValue < 0) {
        nextActualValue = step < 0 ? -1 : 0;
      }
    } else if (nextActualValue >= arrayLength) {
      nextActualValue = step < 0 ? arrayLength - 1 : arrayLength;
    }
    return nextActualValue;
  }
}

export const TreeInterpreterInstance = new TreeInterpreter();
export default TreeInterpreterInstance;
