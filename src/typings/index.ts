export type JSONPrimitive = string | number | boolean | null;
export type JSONValue = JSONPrimitive | JSONObject | JSONArray;
export type JSONObject = { [member: string]: JSONValue };
export type JSONArray = JSONValue[];

export enum Token {
  TOK_EOF = 'EOF',
  TOK_UNQUOTEDIDENTIFIER = 'UnquotedIdentifier',
  TOK_QUOTEDIDENTIFIER = 'QuotedIdentifier',
  TOK_RBRACKET = 'Rbracket',
  TOK_RPAREN = 'Rparen',
  TOK_COMMA = 'Comma',
  TOK_COLON = 'Colon',
  TOK_RBRACE = 'Rbrace',
  TOK_NUMBER = 'Number',
  TOK_CURRENT = 'Current',
  TOK_EXPREF = 'Expref',
  TOK_PIPE = 'Pipe',
  TOK_OR = 'Or',
  TOK_AND = 'And',
  TOK_EQ = 'EQ',
  TOK_GT = 'GT',
  TOK_LT = 'LT',
  TOK_GTE = 'GTE',
  TOK_LTE = 'LTE',
  TOK_NE = 'NE',
  TOK_FLATTEN = 'Flatten',
  TOK_STAR = 'Star',
  TOK_FILTER = 'Filter',
  TOK_DOT = 'Dot',
  TOK_NOT = 'Not',
  TOK_LBRACE = 'Lbrace',
  TOK_LBRACKET = 'Lbracket',
  TOK_LPAREN = 'Lparen',
  TOK_LITERAL = 'Literal',
}

export type LexerTokenValue = string | number | JSONValue;

export interface LexerToken {
  type: Token;
  value: LexerTokenValue;
  start: number;
}

export interface Node {
  type: string;
}

export interface ValueNode<T = LexerTokenValue> extends Node {
  value: T;
}

export interface FieldNode extends Node {
  name: LexerTokenValue;
}

export interface KeyValuePairNode extends FieldNode, ValueNode<ExpressionNodeTree> {}

export interface ExpressionNode<T = ExpressionNodeTree> extends Node {
  children: T[];
}

export interface ComparitorNode extends ExpressionNode {
  name: Token;
}

export type ExpressionNodeTree = Node | ExpressionNode | FieldNode | ValueNode;

export enum InputArgument {
  TYPE_NUMBER = 0,
  TYPE_ANY = 1,
  TYPE_STRING = 2,
  TYPE_ARRAY = 3,
  TYPE_OBJECT = 4,
  TYPE_BOOLEAN = 5,
  TYPE_EXPREF = 6,
  TYPE_NULL = 7,
  TYPE_ARRAY_NUMBER = 8,
  TYPE_ARRAY_STRING = 9,
}

export interface InputSignature {
  types: InputArgument[];
  variadic?: boolean;
}

export type RuntimeFunction<T, U> = (resolvedArgs: T) => U;

export interface FunctionSignature {
  _func: RuntimeFunction<any, any>;
  _signature: InputSignature[];
}

export interface FunctionTable {
  [functionName: string]: FunctionSignature;
}
