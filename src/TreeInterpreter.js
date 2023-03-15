import { isFalse, isObject, strictDeepEqual } from './utils';
import { Token } from './Lexer';
import { Runtime } from './Runtime';
export class TreeInterpreter {
    constructor() {
        this._rootValue = null;
        this.runtime = new Runtime(this);
    }
    search(node, value) {
        this._rootValue = value;
        return this.visit(node, value);
    }
    visit(node, value) {
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
                    field = value[node.name];
                    if (field === undefined) {
                        return null;
                    }
                    return field;
                }
                return null;
            case 'Subexpression':
                result = this.visit(node.children[0], value);
                for (i = 1; i < node.children.length; i += 1) {
                    result = this.visit(node.children[1], result);
                    if (result === null) {
                        return null;
                    }
                }
                return result;
            case 'IndexExpression':
                left = this.visit(node.children[0], value);
                right = this.visit(node.children[1], left);
                return right;
            case 'Index':
                if (!Array.isArray(value)) {
                    return null;
                }
                let index = node.value;
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
                const sliceParams = [...node.children];
                const computed = this.computeSliceParams(value.length, sliceParams);
                const [start, stop, step] = computed;
                result = [];
                if (step > 0) {
                    for (i = start; i < stop; i += step) {
                        result.push(value[i]);
                    }
                }
                else {
                    for (i = start; i > stop; i += step) {
                        result.push(value[i]);
                    }
                }
                return result;
            case 'Projection':
                base = this.visit(node.children[0], value);
                if (!Array.isArray(base)) {
                    return null;
                }
                collected = [];
                for (i = 0; i < base.length; i += 1) {
                    current = this.visit(node.children[1], base[i]);
                    if (current !== null) {
                        collected.push(current);
                    }
                }
                return collected;
            case 'ValueProjection':
                base = this.visit(node.children[0], value);
                if (!isObject(base)) {
                    return null;
                }
                collected = [];
                const values = Object.values(base);
                for (i = 0; i < values.length; i += 1) {
                    current = this.visit(node.children[1], values[i]);
                    if (current !== null) {
                        collected.push(current);
                    }
                }
                return collected;
            case 'FilterProjection':
                base = this.visit(node.children[0], value);
                if (!Array.isArray(base)) {
                    return null;
                }
                const filtered = [];
                const finalResults = [];
                for (i = 0; i < base.length; i += 1) {
                    matched = this.visit(node.children[2], base[i]);
                    if (!isFalse(matched)) {
                        filtered.push(base[i]);
                    }
                }
                for (let j = 0; j < filtered.length; j += 1) {
                    current = this.visit(node.children[1], filtered[j]);
                    if (current !== null) {
                        finalResults.push(current);
                    }
                }
                return finalResults;
            case 'Comparator':
                first = this.visit(node.children[0], value);
                second = this.visit(node.children[1], value);
                switch (node.name) {
                    case Token.TOK_EQ:
                        result = strictDeepEqual(first, second);
                        break;
                    case Token.TOK_NE:
                        result = !strictDeepEqual(first, second);
                        break;
                    case Token.TOK_GT:
                        result = first > second;
                        break;
                    case Token.TOK_GTE:
                        result = first >= second;
                        break;
                    case Token.TOK_LT:
                        result = first < second;
                        break;
                    case Token.TOK_LTE:
                        result = first <= second;
                        break;
                    default:
                        throw new Error(`Unknown comparator: ${node.name}`);
                }
                return result;
            case Token.TOK_FLATTEN:
                const original = this.visit(node.children[0], value);
                if (!Array.isArray(original)) {
                    return null;
                }
                let merged = [];
                for (i = 0; i < original.length; i += 1) {
                    current = original[i];
                    if (Array.isArray(current)) {
                        merged = [...merged, ...current];
                    }
                    else {
                        merged.push(current);
                    }
                }
                return merged;
            case 'Identity':
                return value;
            case 'MultiSelectList':
                if (value === null) {
                    return null;
                }
                collected = [];
                for (i = 0; i < node.children.length; i += 1) {
                    collected.push(this.visit(node.children[i], value));
                }
                return collected;
            case 'MultiSelectHash':
                if (value === null) {
                    return null;
                }
                collected = {};
                let child;
                for (i = 0; i < node.children.length; i += 1) {
                    child = node.children[i];
                    collected[child.name] = this.visit(child.value, value);
                }
                return collected;
            case 'OrExpression':
                matched = this.visit(node.children[0], value);
                if (isFalse(matched)) {
                    matched = this.visit(node.children[1], value);
                }
                return matched;
            case 'AndExpression':
                first = this.visit(node.children[0], value);
                if (isFalse(first)) {
                    return first;
                }
                return this.visit(node.children[1], value);
            case 'NotExpression':
                first = this.visit(node.children[0], value);
                return isFalse(first);
            case 'Literal':
                return node.value;
            case Token.TOK_PIPE:
                left = this.visit(node.children[0], value);
                return this.visit(node.children[1], left);
            case Token.TOK_CURRENT:
                return value;
            case Token.TOK_ROOT:
                return this._rootValue;
            case 'Function':
                const resolvedArgs = [];
                for (let j = 0; j < node.children.length; j += 1) {
                    resolvedArgs.push(this.visit(node.children[j], value));
                }
                return this.runtime.callFunction(node.name, resolvedArgs);
            case 'ExpressionReference':
                const refNode = node.children[0];
                refNode.jmespathType = Token.TOK_EXPREF;
                return refNode;
            default:
                throw new Error(`Unknown node type: ${node.type}`);
        }
    }
    computeSliceParams(arrayLength, sliceParams) {
        let [start, stop, step] = sliceParams;
        if (step === null) {
            step = 1;
        }
        else if (step === 0) {
            const error = new Error('Invalid slice, step cannot be 0');
            error.name = 'RuntimeError';
            throw error;
        }
        const stepValueNegative = step < 0 ? true : false;
        start = start === null ? (stepValueNegative ? arrayLength - 1 : 0) : this.capSliceRange(arrayLength, start, step);
        stop = stop === null ? (stepValueNegative ? -1 : arrayLength) : this.capSliceRange(arrayLength, stop, step);
        return [start, stop, step];
    }
    capSliceRange(arrayLength, actualValue, step) {
        let nextActualValue = actualValue;
        if (nextActualValue < 0) {
            nextActualValue += arrayLength;
            if (nextActualValue < 0) {
                nextActualValue = step < 0 ? -1 : 0;
            }
        }
        else if (nextActualValue >= arrayLength) {
            nextActualValue = step < 0 ? arrayLength - 1 : arrayLength;
        }
        return nextActualValue;
    }
}
export const TreeInterpreterInstance = new TreeInterpreter();
export default TreeInterpreterInstance;
//# sourceMappingURL=TreeInterpreter.js.map