import { JSONValue } from './JSON.type';

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
  TOK_ROOT = 'Root',
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

export type LexerTokenValue = JSONValue;

export interface LexerToken {
  type: Token;
  value: LexerTokenValue;
  start: number;
}
