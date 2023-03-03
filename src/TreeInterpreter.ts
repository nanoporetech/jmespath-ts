import { add, div, divide, ensureNumbers, isFalse, mod, mul, strictDeepEqual, sub } from './utils';
import { Runtime } from './Runtime';
import type { ExpressionNode, ExpressionReference, SliceNode } from './AST.type';
import type { JSONArray, JSONObject, JSONValue } from './JSON.type';
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
      case 'Field':
        if (value === null || typeof value !== 'object' || Array.isArray(value)) {
          return null;
        }
        return value[node.name] ?? null;
      case 'IndexExpression':
      case 'Subexpression':
        return this.visit(node.right, this.visit(node.left, value));
      case 'Index': {
        if (!Array.isArray(value)) {
          return null;
        }
        const index = node.value < 0 ? value.length + node.value : node.value;
        return value[index] ?? null;
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
        for (const elem of base) {
          const current = this.visit(right, elem) as JSONValue;
          if (current !== null) {
            collected.push(current);
          }
        }
        return collected as JSONValue;
      }
      case 'ValueProjection': {
        const { left, right } = node;

        const base = this.visit(left, value);
        if (base === null || typeof base !== 'object' || Array.isArray(base)) {
          return null;
        }
        const collected: JSONArray = [];
        const values = Object.values(base);
        for (const elem of values) {
          const current = this.visit(right, elem) as JSONValue;
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

        const results: JSONArray = [];
        for (const elem of base) {
          const matched = this.visit(condition, elem);
          if (isFalse(matched)) {
            continue;
          }
          const result = this.visit(right, elem) as JSONValue;
          if (result !== null) {
            results.push(result);
          }
        }
        return results;
      }
      case 'Arithmetic': {
        const first = this.visit(node.left, value) as JSONValue;
        const second = this.visit(node.right, value) as JSONValue;
        switch (node.operator) {
          case Token.TOK_PLUS:
            return add(first, second);

          case Token.TOK_MINUS:
            return sub(first, second);

          case Token.TOK_MULTIPLY:
          case Token.TOK_STAR:
            return mul(first, second);

          case Token.TOK_DIVIDE:
            return divide(first, second);

          case Token.TOK_MODULO:
            return mod(first, second);

          case Token.TOK_DIV:
            return div(first, second);

          default:
            throw new Error(`Unknown arithmetic operator: ${node.operator}`);
        }
      }
      case 'Unary': {
        const operand = this.visit(node.operand, value) as JSONValue;
        switch (node.operator) {
          case Token.TOK_PLUS:
            ensureNumbers(operand);
            return operand as number;

          case Token.TOK_MINUS:
            ensureNumbers(operand);
            return -(operand as number);

          default:
            throw new Error(`Unknown arithmetic operator: ${node.operator}`);
        }
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
        return Array.isArray(original) ? original.flat() : null;
      }
      case 'Root':
        return this._rootValue;
      case 'MultiSelectList': {
        if (value === null) {
          return null;
        }
        const collected: JSONArray = [];
        for (const child of node.children) {
          collected.push(this.visit(child, value) as JSONValue);
        }
        return collected;
      }
      case 'MultiSelectHash': {
        if (value === null) {
          return null;
        }
        const collected: JSONObject = {};
        for (const child of node.children) {
          collected[child.name] = this.visit(child.value, value) as JSONValue;
        }
        return collected;
      }
      case 'OrExpression': {
        const result = this.visit(node.left, value);
        if (isFalse(result)) {
          return this.visit(node.right, value);
        }
        return result;
      }
      case 'AndExpression': {
        const result = this.visit(node.left, value);
        if (isFalse(result)) {
          return result;
        }
        return this.visit(node.right, value);
      }
      case 'NotExpression':
        return isFalse(this.visit(node.child, value));
      case 'Literal':
        return node.value;
      case 'Pipe':
        return this.visit(node.right, this.visit(node.left, value));
      case 'Function': {
        const args: JSONArray = [];
        for (const child of node.children) {
          args.push(this.visit(child, value) as JSONValue);
        }
        return this.runtime.callFunction(node.name, args);
      }
      case 'ExpressionReference':
        return {
          expref: true,
          ...node.child,
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
