import { Parser } from './Parser';
import { Lexer } from './Lexer';
import { Runtime } from './Runtime';
import { TreeInterpreter } from './TreeInterpreter';
import { ExpressionNodeTree, LexerToken, JSONValue, JSONObject } from './typings/index';

export function compile(stream: string): ExpressionNodeTree {
  const parser = new Parser();
  const ast = parser.parse(stream);
  return ast;
}

export function tokenize(stream: string): LexerToken[] {
  const lexer = new Lexer();
  return lexer.tokenize(stream);
}

export function search(data: JSONObject, expression: string): JSONValue {
  const parser = new Parser();
  const runtime = new Runtime();

  // runtime.registerFunction('divide', () => ({
  //   _func: (resolvedArgs: number[]) => {
  //     const [divisor, dividend] = resolvedArgs;
  //     return divisor / dividend;
  //   },
  //   _signature: [{ types: [TYPE_NUMBER] }, { types: [TYPE_NUMBER] }],
  // }));

  const interpreter = new TreeInterpreter(runtime);
  runtime._interpreter = interpreter;
  const node = parser.parse(expression);
  return interpreter.search(node, data);
}

export default {
  search,
  compile,
  tokenize,
};
