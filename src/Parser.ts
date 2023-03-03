import type {
  BinaryArithmeticNode,
  UnaryArithmeticNode,
  BinaryExpressionNode,
  ComparatorNode,
  ComparatorType,
  ExpressionNode,
  FunctionNode,
  IndexNode,
  KeyValuePairNode,
  BinaryOperatorType,
  SliceNode,
  UnaryExpressionNode,
} from './AST.type';
import Lexer from './Lexer';
import { LexerToken, Token } from './Lexer.type';

const bindingPower: Record<string, number> = {
  [Token.TOK_EOF]: 0,
  [Token.TOK_UNQUOTEDIDENTIFIER]: 0,
  [Token.TOK_QUOTEDIDENTIFIER]: 0,
  [Token.TOK_RBRACKET]: 0,
  [Token.TOK_RPAREN]: 0,
  [Token.TOK_COMMA]: 0,
  [Token.TOK_RBRACE]: 0,
  [Token.TOK_NUMBER]: 0,
  [Token.TOK_CURRENT]: 0,
  [Token.TOK_EXPREF]: 0,
  [Token.TOK_ROOT]: 0,
  [Token.TOK_PIPE]: 1,
  [Token.TOK_OR]: 2,
  [Token.TOK_AND]: 3,
  [Token.TOK_EQ]: 5,
  [Token.TOK_GT]: 5,
  [Token.TOK_LT]: 5,
  [Token.TOK_GTE]: 5,
  [Token.TOK_LTE]: 5,
  [Token.TOK_NE]: 5,
  [Token.TOK_MINUS]: 6,
  [Token.TOK_PLUS]: 6,
  [Token.TOK_DIV]: 7,
  [Token.TOK_DIVIDE]: 7,
  [Token.TOK_MODULO]: 7,
  [Token.TOK_MULTIPLY]: 7,
  [Token.TOK_FLATTEN]: 9,
  [Token.TOK_STAR]: 20,
  [Token.TOK_FILTER]: 21,
  [Token.TOK_DOT]: 40,
  [Token.TOK_NOT]: 45,
  [Token.TOK_LBRACE]: 50,
  [Token.TOK_LBRACKET]: 55,
  [Token.TOK_LPAREN]: 60,
};

class TokenParser {
  index = 0;
  tokens: LexerToken[] = [];
  parse(expression: string): ExpressionNode {
    this.loadTokens(expression);
    this.index = 0;
    const ast = this.expression(0);
    if (this.lookahead(0) !== Token.TOK_EOF) {
      const token = this.lookaheadToken(0);
      this.errorToken(token, `Unexpected token type: ${token.type}, value: ${token.value}`);
    }
    return ast;
  }

  private loadTokens(expression: string): void {
    this.tokens = [...Lexer.tokenize(expression), { type: Token.TOK_EOF, value: '', start: expression.length }];
  }

  expression(rbp: number): ExpressionNode {
    const leftToken = this.lookaheadToken(0);
    this.advance();
    let left = this.nud(leftToken);
    let currentTokenType = this.lookahead(0);
    while (rbp < bindingPower[currentTokenType]) {
      this.advance();
      left = this.led(currentTokenType, left);
      currentTokenType = this.lookahead(0);
    }
    return left;
  }

  private lookahead(offset: number): Token {
    return this.tokens[this.index + offset].type;
  }

  private lookaheadToken(offset: number): LexerToken {
    return this.tokens[this.index + offset];
  }

  private advance(): void {
    this.index += 1;
  }

  nud(token: LexerToken): ExpressionNode {
    switch (token.type) {
      case Token.TOK_LITERAL:
        return { type: 'Literal', value: token.value };
      case Token.TOK_UNQUOTEDIDENTIFIER:
        return { type: 'Field', name: token.value as string };
      case Token.TOK_QUOTEDIDENTIFIER:
        if (this.lookahead(0) === Token.TOK_LPAREN) {
          throw new Error('Quoted identifier not allowed for function names.');
        } else {
          return { type: 'Field', name: token.value as string };
        }
      case Token.TOK_NOT: {
        const child = this.expression(bindingPower.Not);
        return { type: 'NotExpression', child };
      }
      case Token.TOK_MINUS: {
        const child = this.expression(bindingPower.Minus);
        return { type: 'Unary', operator: token.type, operand: child } as UnaryArithmeticNode;
      }
      case Token.TOK_PLUS: {
        const child = this.expression(bindingPower.Plus);
        return { type: 'Unary', operator: token.type, operand: child } as UnaryArithmeticNode;
      }
      case Token.TOK_STAR: {
        const left: ExpressionNode = { type: 'Identity' };
        const right: ExpressionNode =
          this.lookahead(0) === Token.TOK_RBRACKET ? left : this.parseProjectionRHS(bindingPower.Star);
        return { type: 'ValueProjection', left, right };
      }
      case Token.TOK_FILTER:
        return this.led(token.type, { type: 'Identity' });
      case Token.TOK_LBRACE:
        return this.parseMultiselectHash();
      case Token.TOK_FLATTEN: {
        const left: ExpressionNode = { type: 'Flatten', child: { type: 'Identity' } };
        const right: ExpressionNode = this.parseProjectionRHS(bindingPower.Flatten);
        return { type: 'Projection', left, right };
      }
      case Token.TOK_LBRACKET: {
        if (this.lookahead(0) === Token.TOK_NUMBER || this.lookahead(0) === Token.TOK_COLON) {
          const right = this.parseIndexExpression();
          return this.projectIfSlice({ type: 'Identity' }, right);
        }
        if (this.lookahead(0) === Token.TOK_STAR && this.lookahead(1) === Token.TOK_RBRACKET) {
          this.advance();
          this.advance();
          const right = this.parseProjectionRHS(bindingPower.Star);
          return {
            left: { type: 'Identity' },
            right,
            type: 'Projection',
          };
        }
        return this.parseMultiselectList();
      }
      case Token.TOK_CURRENT:
        return { type: Token.TOK_CURRENT };
      case Token.TOK_ROOT:
        return { type: Token.TOK_ROOT };
      case Token.TOK_EXPREF: {
        const child = this.expression(bindingPower.Expref);
        return { type: 'ExpressionReference', child };
      }
      case Token.TOK_LPAREN: {
        const args: ExpressionNode[] = [];
        while (this.lookahead(0) !== Token.TOK_RPAREN) {
          let expression: ExpressionNode;
          if (this.lookahead(0) === Token.TOK_CURRENT) {
            expression = { type: Token.TOK_CURRENT };
            this.advance();
          } else {
            expression = this.expression(0);
          }
          args.push(expression);
        }
        this.match(Token.TOK_RPAREN);
        return args[0];
      }
      default:
        this.errorToken(token);
    }
  }

  led(tokenName: string, left: ExpressionNode): ExpressionNode {
    switch (tokenName) {
      case Token.TOK_DOT: {
        const rbp = bindingPower.Dot;
        if (this.lookahead(0) !== Token.TOK_STAR) {
          const right = this.parseDotRHS(rbp);
          return { type: 'Subexpression', left, right };
        }
        this.advance();
        const right = this.parseProjectionRHS(rbp);
        return { type: 'ValueProjection', left, right };
      }
      case Token.TOK_PIPE: {
        const right = this.expression(bindingPower.Pipe);
        return { type: 'Pipe', left, right };
      }
      case Token.TOK_OR: {
        const right = this.expression(bindingPower.Or);
        return { type: 'OrExpression', left, right };
      }
      case Token.TOK_AND: {
        const right = this.expression(bindingPower.And);
        return { type: 'AndExpression', left, right };
      }
      case Token.TOK_LPAREN: {
        if (left.type !== 'Field') {
          throw new Error('Expected a Field node');
        }
        const name = left.name;
        const args: ExpressionNode[] = [];
        let expression: ExpressionNode;
        while (this.lookahead(0) !== Token.TOK_RPAREN) {
          if (this.lookahead(0) === Token.TOK_CURRENT) {
            expression = { type: Token.TOK_CURRENT };
            this.advance();
          } else {
            expression = this.expression(0);
          }
          if (this.lookahead(0) === Token.TOK_COMMA) {
            this.match(Token.TOK_COMMA);
          }
          args.push(expression);
        }
        this.match(Token.TOK_RPAREN);
        const node: FunctionNode = { name, type: 'Function', children: args };
        return node;
      }
      case Token.TOK_FILTER: {
        const condition = this.expression(0);
        this.match(Token.TOK_RBRACKET);
        const right: ExpressionNode =
          this.lookahead(0) === Token.TOK_FLATTEN ? { type: 'Identity' } : this.parseProjectionRHS(bindingPower.Filter);
        return { type: 'FilterProjection', left, right, condition };
      }
      case Token.TOK_FLATTEN: {
        const leftNode: UnaryExpressionNode = { type: 'Flatten', child: left };
        const right = this.parseProjectionRHS(bindingPower.Flatten);
        return { type: 'Projection', left: leftNode, right };
      }
      case Token.TOK_EQ:
      case Token.TOK_NE:
      case Token.TOK_GT:
      case Token.TOK_GTE:
      case Token.TOK_LT:
      case Token.TOK_LTE:
        return this.parseComparator(left, tokenName);
      case Token.TOK_PLUS:
      case Token.TOK_MINUS:
      case Token.TOK_MULTIPLY:
      case Token.TOK_STAR:
      case Token.TOK_DIVIDE:
      case Token.TOK_MODULO:
      case Token.TOK_DIV:
        return this.parseArithmetic(left, tokenName);
      case Token.TOK_LBRACKET: {
        const token = this.lookaheadToken(0);
        if (token.type === Token.TOK_NUMBER || token.type === Token.TOK_COLON) {
          const right = this.parseIndexExpression();
          return this.projectIfSlice(left, right);
        }
        this.match(Token.TOK_STAR);
        this.match(Token.TOK_RBRACKET);
        const right = this.parseProjectionRHS(bindingPower.Star);
        return { type: 'Projection', left, right };
      }

      default:
        return this.errorToken(this.lookaheadToken(0));
    }
  }

  private match(tokenType: Token | LexerToken): void {
    if (this.lookahead(0) === tokenType) {
      this.advance();
      return;
    } else {
      const token = this.lookaheadToken(0);
      this.errorToken(token, `Expected ${tokenType}, got: ${token.type}`);
    }
  }

  private errorToken(token: LexerToken, message = ''): never {
    const error = new Error(message || `Invalid token (${token.type}): "${token.value}"`);
    error.name = 'ParserError';
    throw error;
  }

  private parseIndexExpression(): SliceNode | IndexNode {
    if (this.lookahead(0) === Token.TOK_COLON || this.lookahead(1) === Token.TOK_COLON) {
      return this.parseSliceExpression();
    }
    const value = Number(this.lookaheadToken(0).value);
    this.advance();
    this.match(Token.TOK_RBRACKET);
    return { type: 'Index', value };
  }

  private projectIfSlice(
    left: ExpressionNode,
    right: ExpressionNode,
  ): BinaryExpressionNode<'Projection' | 'IndexExpression'> {
    const indexExpr: BinaryExpressionNode<'IndexExpression'> = { type: 'IndexExpression', left, right };
    if (right.type === 'Slice') {
      return {
        left: indexExpr,
        right: this.parseProjectionRHS(bindingPower.Star),
        type: 'Projection',
      };
    }
    return indexExpr;
  }

  private parseSliceExpression(): SliceNode {
    const parts = [];

    for (let i = 0; i < 3; i += 1) {
      let next = this.lookaheadToken(0);
      if (next.type === Token.TOK_RBRACKET) {
        break;
      }
      if (next.type === Token.TOK_NUMBER) {
        this.advance();
        parts.push(next.value as number);
        next = this.lookaheadToken(0);
      } else {
        parts.push(null);
      }

      // COLON/RBRACKET
      // WARN technically allows for trailing colon
      if (next.type !== Token.TOK_COLON) {
        if (next.type !== Token.TOK_RBRACKET) {
          this.errorToken(next, `Syntax error, unexpected token: ${next.value}(${next.type})`);
        }
        break;
      }

      this.advance();
    }

    this.match(Token.TOK_RBRACKET);

    const [start = null, stop = null, step = null] = parts;

    return { type: 'Slice', start, stop, step };
  }

  private parseComparator(left: ExpressionNode, comparator: ComparatorType): ComparatorNode {
    const right = this.expression(bindingPower[comparator]);
    return { type: 'Comparator', name: comparator, left, right };
  }

  private parseArithmetic(left: ExpressionNode, operator: BinaryOperatorType): BinaryArithmeticNode {
    const right = this.expression(bindingPower[operator]);
    return { type: 'Arithmetic', operator: operator, left, right };
  }

  private parseDotRHS(rbp: number): ExpressionNode {
    const lookahead = this.lookahead(0);
    const exprTokens = [Token.TOK_UNQUOTEDIDENTIFIER, Token.TOK_QUOTEDIDENTIFIER, Token.TOK_STAR];
    if (exprTokens.includes(lookahead)) {
      return this.expression(rbp);
    }
    if (lookahead === Token.TOK_LBRACKET) {
      this.match(Token.TOK_LBRACKET);
      return this.parseMultiselectList();
    }
    if (lookahead === Token.TOK_LBRACE) {
      this.match(Token.TOK_LBRACE);
      return this.parseMultiselectHash();
    }
    const token = this.lookaheadToken(0);
    this.errorToken(token, `Syntax error, unexpected token: ${token.value}(${token.type})`);
  }

  private parseProjectionRHS(rbp: number): ExpressionNode {
    if (bindingPower[this.lookahead(0)] < 10) {
      return { type: 'Identity' };
    }
    if (this.lookahead(0) === Token.TOK_LBRACKET) {
      return this.expression(rbp);
    }
    if (this.lookahead(0) === Token.TOK_FILTER) {
      return this.expression(rbp);
    }
    if (this.lookahead(0) === Token.TOK_DOT) {
      this.match(Token.TOK_DOT);
      return this.parseDotRHS(rbp);
    }
    const token = this.lookaheadToken(0);
    this.errorToken(token, `Syntax error, unexpected token: ${token.value}(${token.type})`);
  }

  private parseMultiselectList(): ExpressionNode {
    const expressions: ExpressionNode[] = [];
    while (this.lookahead(0) !== Token.TOK_RBRACKET) {
      const expression = this.expression(0);
      expressions.push(expression);
      if (this.lookahead(0) === Token.TOK_COMMA) {
        this.match(Token.TOK_COMMA);
        if (this.lookahead(0) === Token.TOK_RBRACKET) {
          throw new Error('Unexpected token Rbracket');
        }
      }
    }
    this.match(Token.TOK_RBRACKET);
    return { type: 'MultiSelectList', children: expressions };
  }

  private parseMultiselectHash(): ExpressionNode {
    const pairs: KeyValuePairNode[] = [];
    const identifierTypes = [Token.TOK_UNQUOTEDIDENTIFIER, Token.TOK_QUOTEDIDENTIFIER];
    let keyToken;
    let keyName: string;
    let value: ExpressionNode;
    // tslint:disable-next-line: prettier
    for (;;) {
      keyToken = this.lookaheadToken(0);
      if (!identifierTypes.includes(keyToken.type)) {
        throw new Error(`Expecting an identifier token, got: ${keyToken.type}`);
      }
      keyName = keyToken.value as string;
      this.advance();
      this.match(Token.TOK_COLON);
      value = this.expression(0);
      pairs.push({ value, type: 'KeyValuePair', name: keyName });
      if (this.lookahead(0) === Token.TOK_COMMA) {
        this.match(Token.TOK_COMMA);
      } else if (this.lookahead(0) === Token.TOK_RBRACE) {
        this.match(Token.TOK_RBRACE);
        break;
      }
    }
    return { type: 'MultiSelectHash', children: pairs };
  }
}

export const Parser = new TokenParser();
export default Parser;
