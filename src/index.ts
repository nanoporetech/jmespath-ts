import Parser from './Parser';
import Lexer from './Lexer';
import TreeInterpreterInst from './TreeInterpreter';
import { ExpressionNodeTree, LexerToken } from './Lexer';
import { InputArgument, RuntimeFunction, InputSignature } from './Runtime';

export type { FunctionSignature, RuntimeFunction, InputSignature } from './Runtime';
export type ObjectDict<T = unknown> = Record<string, T | undefined>;

export type JSONPrimitive = string | number | boolean | null;
export type JSONValue = JSONPrimitive | JSONObject | JSONArray;
export type JSONObject = { [member: string]: JSONValue };
export type JSONArrayObject = JSONObject[];
export type JSONArray = JSONValue[];

export const TYPE_ANY = InputArgument.TYPE_ANY;
export const TYPE_ARRAY = InputArgument.TYPE_ARRAY;
export const TYPE_ARRAY_NUMBER = InputArgument.TYPE_ARRAY_NUMBER;
export const TYPE_ARRAY_STRING = InputArgument.TYPE_ARRAY_STRING;
export const TYPE_BOOLEAN = InputArgument.TYPE_BOOLEAN;
export const TYPE_EXPREF = InputArgument.TYPE_EXPREF;
export const TYPE_NULL = InputArgument.TYPE_NULL;
export const TYPE_NUMBER = InputArgument.TYPE_NUMBER;
export const TYPE_OBJECT = InputArgument.TYPE_OBJECT;
export const TYPE_STRING = InputArgument.TYPE_STRING;

export function compile(expression: string): ExpressionNodeTree {
  const nodeTree = Parser.parse(expression);
  return nodeTree;
}

export function tokenize(expression: string): LexerToken[] {
  return Lexer.tokenize(expression);
}

export const registerFunction = (
  functionName: string,
  customFunction: RuntimeFunction<any, any>,
  signature: InputSignature[],
): void => {
  TreeInterpreterInst.runtime.registerFunction(functionName, customFunction, signature);
};

export function search(data: JSONValue, expression: string): JSONValue {
  const nodeTree = Parser.parse(expression);
  return TreeInterpreterInst.search(nodeTree, data);
}

export const TreeInterpreter = TreeInterpreterInst;

export const jmespath = {
  compile,
  registerFunction,
  search,
  tokenize,
  TreeInterpreter,
  TYPE_ANY,
  TYPE_ARRAY_NUMBER,
  TYPE_ARRAY_STRING,
  TYPE_ARRAY,
  TYPE_BOOLEAN,
  TYPE_EXPREF,
  TYPE_NULL,
  TYPE_NUMBER,
  TYPE_OBJECT,
  TYPE_STRING,
};

export default jmespath;
