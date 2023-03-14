import type {
  ComparitorNode,
  ExpressionNode,
  ExpressionNodeTree,
  FieldNode,
  KeyValuePairNode,
  LexerToken,
  ValueNode,
  ASTNode,
} from './Lexer';
import { Lexer, Token } from './Lexer';

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
  parse(expression: string): ASTNode {
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

  expression(rbp: number): ASTNode {
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

  nud(token: LexerToken): ASTNode {
    let left;
    let right;
    let expression;
    switch (token.type) {
      case Token.TOK_LITERAL:
        return { type: 'Literal', value: token.value } as ValueNode;
      case Token.TOK_UNQUOTEDIDENTIFIER:
        return { type: 'Field', name: token.value } as FieldNode;
      case Token.TOK_QUOTEDIDENTIFIER:
        const node: FieldNode = { type: 'Field', name: token.value };
        if (this.lookahead(0) === Token.TOK_LPAREN) {
          throw new Error('Quoted identifier not allowed for function names.');
        } else {
          return node;
        }
      case Token.TOK_NOT:
        right = this.expression(bindingPower.Not);
        return { type: 'NotExpression', children: [right] } as ExpressionNode;
      case Token.TOK_STAR:
        left = { type: 'Identity' };
        right =
          (this.lookahead(0) === Token.TOK_RBRACKET && { type: 'Identity' }) ||
          this.parseProjectionRHS(bindingPower.Star);
        return { type: 'ValueProjection', children: [left, right] } as ExpressionNode;
      case Token.TOK_FILTER:
        return this.led(token.type, { type: 'Identity' } as ASTNode);
      case Token.TOK_LBRACE:
        return this.parseMultiselectHash();
      case Token.TOK_FLATTEN:
        left = { type: Token.TOK_FLATTEN, children: [{ type: 'Identity' }] };
        right = this.parseProjectionRHS(bindingPower.Flatten);
        return { type: 'Projection', children: [left, right] } as ExpressionNode;
      case Token.TOK_LBRACKET:
        if (this.lookahead(0) === Token.TOK_NUMBER || this.lookahead(0) === Token.TOK_COLON) {
          right = this.parseIndexExpression();
          return this.projectIfSlice({ type: 'Identity' }, right);
        }
        if (this.lookahead(0) === Token.TOK_STAR && this.lookahead(1) === Token.TOK_RBRACKET) {
          this.advance();
          this.advance();
          right = this.parseProjectionRHS(bindingPower.Star);
          return {
            children: [{ type: 'Identity' }, right],
            type: 'Projection',
          } as ExpressionNode;
        }
        return this.parseMultiselectList();
      case Token.TOK_CURRENT:
        return { type: Token.TOK_CURRENT };
      case Token.TOK_ROOT:
        return { type: Token.TOK_ROOT };
      case Token.TOK_EXPREF:
        expression = this.expression(bindingPower.Expref);
        return { type: 'ExpressionReference', children: [expression] } as ExpressionNode;
      case Token.TOK_LPAREN:
        const args: ASTNode[] = [];
        while (this.lookahead(0) !== Token.TOK_RPAREN) {
          if (this.lookahead(0) === Token.TOK_CURRENT) {
            expression = { type: Token.TOK_CURRENT } as ASTNode;
            this.advance();
          } else {
            expression = this.expression(0);
          }
          args.push(expression);
        }
        this.match(Token.TOK_RPAREN);
        return args[0];
      default:
        this.errorToken(token);
    }
  }

  led(tokenName: string, left: ExpressionNodeTree): ExpressionNode | ComparitorNode {
    let right: ExpressionNodeTree;
    switch (tokenName) {
      case Token.TOK_DOT:
        const rbp = bindingPower.Dot;
        if (this.lookahead(0) !== Token.TOK_STAR) {
          right = this.parseDotRHS(rbp);
          return { type: 'Subexpression', children: [left, right] };
        }
        this.advance();
        right = this.parseProjectionRHS(rbp);
        return { type: 'ValueProjection', children: [left, right] };

      case Token.TOK_PIPE:
        right = this.expression(bindingPower.Pipe);
        return { type: Token.TOK_PIPE, children: [left, right] };
      case Token.TOK_OR:
        right = this.expression(bindingPower.Or);
        return { type: 'OrExpression', children: [left, right] };
      case Token.TOK_AND:
        right = this.expression(bindingPower.And);
        return { type: 'AndExpression', children: [left, right] };
      case Token.TOK_LPAREN:
        const name = (left as FieldNode).name;
        const args: ASTNode[] = [];
        let expression: ASTNode;
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
        const node = { name, type: 'Function', children: args };
        return node;
      case Token.TOK_FILTER:
        const condition = this.expression(0);
        this.match(Token.TOK_RBRACKET);
        right =
          (this.lookahead(0) === Token.TOK_FLATTEN && { type: 'Identity' }) ||
          this.parseProjectionRHS(bindingPower.Filter);
        return { type: 'FilterProjection', children: [left, right, condition] };
      case Token.TOK_FLATTEN:
        const leftNode = { type: Token.TOK_FLATTEN, children: [left] };
        const rightNode = this.parseProjectionRHS(bindingPower.Flatten);
        return { type: 'Projection', children: [leftNode, rightNode] };
      case Token.TOK_EQ:
      case Token.TOK_NE:
      case Token.TOK_GT:
      case Token.TOK_GTE:
      case Token.TOK_LT:
      case Token.TOK_LTE:
        return this.parseComparator(left, tokenName);
      case Token.TOK_LBRACKET:
        const token = this.lookaheadToken(0);
        if (token.type === Token.TOK_NUMBER || token.type === Token.TOK_COLON) {
          right = this.parseIndexExpression();
          return this.projectIfSlice(left, right);
        }
        this.match(Token.TOK_STAR);
        this.match(Token.TOK_RBRACKET);
        right = this.parseProjectionRHS(bindingPower.Star);
        return { type: 'Projection', children: [left, right] };

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

  private parseIndexExpression(): ValueNode | ExpressionNode<number | null> {
    if (this.lookahead(0) === Token.TOK_COLON || this.lookahead(1) === Token.TOK_COLON) {
      return this.parseSliceExpression();
    }
    const node: ValueNode = {
      type: 'Index',
      value: this.lookaheadToken(0).value,
    };
    this.advance();
    this.match(Token.TOK_RBRACKET);
    return node;
  }

  private projectIfSlice(left: ASTNode, right: ASTNode): ExpressionNode {
    const indexExpr: ExpressionNode = { type: 'IndexExpression', children: [left, right] };
    if (right.type === 'Slice') {
      return {
        children: [indexExpr, this.parseProjectionRHS(bindingPower.Star)],
        type: 'Projection',
      };
    }
    return indexExpr;
  }

  private parseSliceExpression(): ExpressionNode<number | null> {
    const parts: (number | null)[] = [null, null, null];
    let index = 0;
    let currentTokenType = this.lookahead(0);
    while (currentTokenType !== Token.TOK_RBRACKET && index < 3) {
      if (currentTokenType === Token.TOK_COLON) {
        index += 1;
        this.advance();
      } else if (currentTokenType === Token.TOK_NUMBER) {
        parts[index] = this.lookaheadToken(0).value as number;
        this.advance();
      } else {
        const token = this.lookaheadToken(0);
        this.errorToken(token, `Syntax error, unexpected token: ${token.value}(${token.type})`);
      }
      currentTokenType = this.lookahead(0);
    }
    this.match(Token.TOK_RBRACKET);
    if (parts[2] === 0) {
      throw new Error('Invalid slice, step cannot be 0');
    }
    return {
      children: parts,
      type: 'Slice',
    };
  }

  private parseComparator(left: ASTNode, comparator: Token): ComparitorNode {
    const right = this.expression(bindingPower[comparator]);
    return { type: 'Comparator', name: comparator, children: [left, right] };
  }

  private parseDotRHS(rbp: number): ASTNode {
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

  private parseProjectionRHS(rbp: number): ASTNode {
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
    const expressions: ASTNode[] = [];
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
    let value: ASTNode;
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
