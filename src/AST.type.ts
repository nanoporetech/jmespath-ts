import { JSONValue } from './JSON.type';
import { Token } from './Lexer.type';

export interface FieldNode {
  readonly type: 'Field';
  readonly name: string;
}

export interface LiteralNode {
  readonly type: 'Literal';
  readonly value: JSONValue;
}

export interface IndexNode {
  readonly type: 'Index';
  readonly value: number;
}

export interface FilterProjectionNode {
  readonly type: 'FilterProjection';
  readonly left: ExpressionNode;
  readonly right: ExpressionNode;
  readonly condition: ExpressionNode;
}

export interface SliceNode {
  readonly type: 'Slice';
  readonly start: number | null;
  readonly stop: number | null;
  readonly step: number | null;
}

export type BinaryOperatorType = 'Plus' | 'Minus' | 'Multiply' | Token.TOK_STAR | 'Divide' | 'Modulo' | 'Div';
export type UnaryOperatorType = 'Plus' | 'Minus';

export interface BinaryArithmeticNode {
  readonly type: 'Arithmetic';
  readonly operator: BinaryOperatorType;
  readonly left: ExpressionNode;
  readonly right: ExpressionNode;
}
export interface UnaryArithmeticNode {
  readonly type: 'Unary';
  readonly operator: UnaryOperatorType;
  readonly operand: ExpressionNode;
}

export type ComparatorType = 'GT' | 'LT' | 'GTE' | 'LTE' | 'NE' | 'EQ';

export interface ComparatorNode {
  readonly type: 'Comparator';
  readonly name: ComparatorType;
  readonly left: ExpressionNode;
  readonly right: ExpressionNode;
}

export interface KeyValuePairNode {
  readonly type: 'KeyValuePair';
  readonly name: string;
  readonly value: ExpressionNode;
}

export interface MultiSelectHashNode {
  type: 'MultiSelectHash';
  children: KeyValuePairNode[];
}

export interface MultiSelectListNode {
  type: 'MultiSelectList';
  children: ExpressionNode[];
}

export interface FunctionNode {
  readonly type: 'Function';
  readonly name: string;
  readonly children: ExpressionNode[];
}

type BinaryExpressionType =
  | 'Subexpression'
  | 'Pipe'
  | 'ValueProjection'
  | 'IndexExpression'
  | 'Projection'
  | 'OrExpression'
  | 'AndExpression';

type UnaryExpressionType = 'NotExpression' | 'Flatten' | 'ExpressionReference';
type SimpleExpressionType = 'Identity' | 'Current' | 'Root';

export interface SimpleExpressionNode<T extends SimpleExpressionType = SimpleExpressionType> {
  readonly type: T;
}
export interface UnaryExpressionNode<T extends UnaryExpressionType = UnaryExpressionType> {
  readonly type: T;
  readonly child: ExpressionNode;
}
export interface BinaryExpressionNode<T extends BinaryExpressionType = BinaryExpressionType> {
  readonly type: T;
  readonly left: ExpressionNode;
  readonly right: ExpressionNode;
}

export type ExpressionNode =
  | SimpleExpressionNode
  | UnaryExpressionNode
  | BinaryExpressionNode
  | UnaryArithmeticNode
  | BinaryArithmeticNode
  | ComparatorNode
  | SliceNode
  | FilterProjectionNode
  | IndexNode
  | LiteralNode
  | FieldNode
  | MultiSelectHashNode
  | MultiSelectListNode
  | FunctionNode;

export type ExpressionReference = { expref: true } & ExpressionNode;
