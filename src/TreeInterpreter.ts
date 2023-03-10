import type {
  ExpressionNodeTree,
  FieldNode,
  ExpressionNode,
  ValueNode,
  ComparitorNode,
  KeyValuePairNode,
} from './Lexer';
import { isFalse, isObject, strictDeepEqual } from './utils';
import { Token } from './Lexer';
import { Runtime } from './Runtime';
import type { JSONValue } from '.';

export class TreeInterpreter {
  runtime: Runtime;
  private _rootValue: JSONValue | null = null;

  constructor() {
    this.runtime = new Runtime(this);
  }

  search(node: ExpressionNodeTree, value: JSONValue): JSONValue {
    this._rootValue = value;
    return this.visit(node, value) as JSONValue;
  }

  visit(node: ExpressionNodeTree, value: JSONValue | ExpressionNodeTree): JSONValue | ExpressionNodeTree {
    let matched;
    let current;
    let result;
    let first;
    let second;
    let field;
    let left;
    let right;
    let collected;
    let i;
    let base;
    switch (node.type) {
      case 'Field':
        if (value === null) {
          return null;
        }
        if (isObject(value)) {
          field = value[(node as FieldNode).name as string];
          if (field === undefined) {
            return null;
          }
          return field;
        }
        return null;
      case 'Subexpression':
        result = this.visit((node as ExpressionNode).children[0], value);
        for (i = 1; i < (node as ExpressionNode).children.length; i += 1) {
          if (result === null) {
            return null;
          }
          result = this.visit((node as ExpressionNode).children[1], result);
        }
        return result;
      case 'IndexExpression':
        left = this.visit((node as ExpressionNode).children[0], value);
        right = this.visit((node as ExpressionNode).children[1], left);
        return right;
      case 'Index':
        if (!Array.isArray(value)) {
          return null;
        }
        let index = (node as ValueNode<number>).value;
        if (index < 0) {
          index = value.length + index;
        }
        result = value[index];
        if (result === undefined) {
          result = null;
        }
        return result;
      case 'Slice':
        if (!Array.isArray(value)) {
          return null;
        }
        const sliceParams = [...(node as ExpressionNode<number>).children];
        const computed = this.computeSliceParams(value.length, sliceParams);
        const [start, stop, step] = computed;
        result = [];
        if (step > 0) {
          for (i = start; i < stop; i += step) {
            result.push(value[i]);
          }
        } else {
          for (i = start; i > stop; i += step) {
            result.push(value[i]);
          }
        }
        return result;
      case 'Projection':
        base = this.visit((node as ExpressionNode).children[0], value);
        if (!Array.isArray(base)) {
          return null;
        }
        collected = [];
        for (i = 0; i < base.length; i += 1) {
          current = this.visit((node as ExpressionNode).children[1], base[i]);
          if (current !== null) {
            collected.push(current);
          }
        }
        return collected as JSONValue;
      case 'ValueProjection':
        base = this.visit((node as ExpressionNode).children[0], value);
        if (!isObject(base)) {
          return null;
        }
        collected = [];
        const values = Object.values(base);
        for (i = 0; i < values.length; i += 1) {
          current = this.visit((node as ExpressionNode).children[1], values[i]);
          if (current !== null) {
            collected.push(current);
          }
        }
        return collected as JSONValue;
      case 'FilterProjection':
        base = this.visit((node as ExpressionNode).children[0], value);
        if (!Array.isArray(base)) {
          return null;
        }
        const filtered = [];
        const finalResults = [];
        for (i = 0; i < base.length; i += 1) {
          matched = this.visit((node as ExpressionNode).children[2], base[i]);
          if (!isFalse(matched)) {
            filtered.push(base[i]);
          }
        }
        for (let j = 0; j < filtered.length; j += 1) {
          current = this.visit((node as ExpressionNode).children[1], filtered[j]);
          if (current !== null) {
            finalResults.push(current);
          }
        }
        return finalResults as JSONValue;
      case 'Comparator':
        first = this.visit((node as ExpressionNode).children[0], value);
        second = this.visit((node as ExpressionNode).children[1], value);
        switch ((node as ComparitorNode).name) {
          case Token.TOK_EQ:
            result = strictDeepEqual(first, second);
            break;
          case Token.TOK_NE:
            result = !strictDeepEqual(first, second);
            break;
          case Token.TOK_GT:
            result = (first as number) > (second as number);
            break;
          case Token.TOK_GTE:
            result = (first as number) >= (second as number);
            break;
          case Token.TOK_LT:
            result = (first as number) < (second as number);
            break;
          case Token.TOK_LTE:
            result = (first as number) <= (second as number);
            break;
          default:
            throw new Error(`Unknown comparator: ${(node as ComparitorNode).name}`);
        }
        return result;
      case Token.TOK_FLATTEN:
        const original = this.visit((node as ExpressionNode).children[0], value);
        if (!Array.isArray(original)) {
          return null;
        }
        let merged: JSONValue[] = [];
        for (i = 0; i < original.length; i += 1) {
          current = original[i];
          if (Array.isArray(current)) {
            merged = [...merged, ...current];
          } else {
            merged.push(current);
          }
        }
        return merged;
      case 'Identity':
        return value;
      case 'MultiSelectList':
        collected = [];
        for (i = 0; i < (node as ExpressionNode).children.length; i += 1) {
          collected.push(this.visit((node as ExpressionNode).children[i], value));
        }
        return collected as JSONValue;
      case 'MultiSelectHash':
        if (value === null) {
          return null;
        }
        collected = {};
        let child: KeyValuePairNode;
        for (i = 0; i < (node as ExpressionNode).children.length; i += 1) {
          child = (node as ExpressionNode<KeyValuePairNode>).children[i];
          collected[child.name as string] = this.visit(child.value, value);
        }
        return collected;
      case 'OrExpression':
        matched = this.visit((node as ExpressionNode).children[0], value);
        if (isFalse(matched)) {
          matched = this.visit((node as ExpressionNode).children[1], value);
        }
        return matched;
      case 'AndExpression':
        first = this.visit((node as ExpressionNode).children[0], value);

        if (isFalse(first)) {
          return first;
        }
        return this.visit((node as ExpressionNode).children[1], value);
      case 'NotExpression':
        first = this.visit((node as ExpressionNode).children[0], value);
        return isFalse(first);
      case 'Literal':
        return (node as ValueNode<JSONValue>).value;
      case Token.TOK_PIPE:
        left = this.visit((node as ExpressionNode).children[0], value);
        return this.visit((node as ExpressionNode).children[1], left);
      case Token.TOK_CURRENT:
        return value;
      case Token.TOK_ROOT:
        return this._rootValue;
      case 'Function':
        const resolvedArgs: JSONValue[] = [];
        for (let j = 0; j < (node as ExpressionNode).children.length; j += 1) {
          resolvedArgs.push(this.visit((node as ExpressionNode).children[j], value) as JSONValue);
        }
        return this.runtime.callFunction((node as FieldNode).name as string, resolvedArgs) as JSONValue;
      case 'ExpressionReference':
        const refNode = (node as ExpressionNode).children[0] as ExpressionNode;
        refNode.jmespathType = Token.TOK_EXPREF;
        return refNode;
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  computeSliceParams(arrayLength: number, sliceParams: number[]): number[] {
    let [start, stop, step] = sliceParams;
    if (step === null) {
      step = 1;
    } else if (step === 0) {
      const error = new Error('Invalid slice, step cannot be 0');
      error.name = 'RuntimeError';
      throw error;
    }
    const stepValueNegative = step < 0 ? true : false;
    start = start === null ? (stepValueNegative ? arrayLength - 1 : 0) : this.capSliceRange(arrayLength, start, step);
    stop = stop === null ? (stepValueNegative ? -1 : arrayLength) : this.capSliceRange(arrayLength, stop, step);

    return [start, stop, step];
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
