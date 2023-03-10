import { Token } from './Lexer';
import { isObject } from './utils';
import { lower, upper } from './utils/strings';
export var InputArgument;
(function (InputArgument) {
    InputArgument[InputArgument["TYPE_NUMBER"] = 0] = "TYPE_NUMBER";
    InputArgument[InputArgument["TYPE_ANY"] = 1] = "TYPE_ANY";
    InputArgument[InputArgument["TYPE_STRING"] = 2] = "TYPE_STRING";
    InputArgument[InputArgument["TYPE_ARRAY"] = 3] = "TYPE_ARRAY";
    InputArgument[InputArgument["TYPE_OBJECT"] = 4] = "TYPE_OBJECT";
    InputArgument[InputArgument["TYPE_BOOLEAN"] = 5] = "TYPE_BOOLEAN";
    InputArgument[InputArgument["TYPE_EXPREF"] = 6] = "TYPE_EXPREF";
    InputArgument[InputArgument["TYPE_NULL"] = 7] = "TYPE_NULL";
    InputArgument[InputArgument["TYPE_ARRAY_NUMBER"] = 8] = "TYPE_ARRAY_NUMBER";
    InputArgument[InputArgument["TYPE_ARRAY_STRING"] = 9] = "TYPE_ARRAY_STRING";
})(InputArgument || (InputArgument = {}));
export class Runtime {
    constructor(interpreter) {
        this.TYPE_NAME_TABLE = {
            [InputArgument.TYPE_NUMBER]: 'number',
            [InputArgument.TYPE_ANY]: 'any',
            [InputArgument.TYPE_STRING]: 'string',
            [InputArgument.TYPE_ARRAY]: 'array',
            [InputArgument.TYPE_OBJECT]: 'object',
            [InputArgument.TYPE_BOOLEAN]: 'boolean',
            [InputArgument.TYPE_EXPREF]: 'expression',
            [InputArgument.TYPE_NULL]: 'null',
            [InputArgument.TYPE_ARRAY_NUMBER]: 'Array<number>',
            [InputArgument.TYPE_ARRAY_STRING]: 'Array<string>',
        };
        this.functionAbs = ([inputValue]) => {
            return Math.abs(inputValue);
        };
        this.functionAvg = ([inputArray]) => {
            let sum = 0;
            for (let i = 0; i < inputArray.length; i += 1) {
                sum += inputArray[i];
            }
            return sum / inputArray.length;
        };
        this.functionCeil = ([inputValue]) => {
            return Math.ceil(inputValue);
        };
        this.functionContains = resolvedArgs => {
            const [searchable, searchValue] = resolvedArgs;
            return searchable.includes(searchValue);
        };
        this.functionEndsWith = resolvedArgs => {
            const [searchStr, suffix] = resolvedArgs;
            return searchStr.includes(suffix, searchStr.length - suffix.length);
        };
        this.functionFloor = ([inputValue]) => {
            return Math.floor(inputValue);
        };
        this.functionJoin = resolvedArgs => {
            const [joinChar, listJoin] = resolvedArgs;
            return listJoin.join(joinChar);
        };
        this.functionKeys = ([inputObject]) => {
            return Object.keys(inputObject);
        };
        this.functionLength = ([inputValue]) => {
            if (!isObject(inputValue)) {
                return inputValue.length;
            }
            return Object.keys(inputValue).length;
        };
        this.functionLower = ([subject]) => {
            return lower(subject);
        };
        this.functionMap = (resolvedArgs) => {
            if (!this._interpreter) {
                return [];
            }
            const mapped = [];
            const interpreter = this._interpreter;
            const exprefNode = resolvedArgs[0];
            const elements = resolvedArgs[1];
            for (let i = 0; i < elements.length; i += 1) {
                mapped.push(interpreter.visit(exprefNode, elements[i]));
            }
            return mapped;
        };
        this.functionMax = ([inputValue]) => {
            if (!inputValue.length) {
                return null;
            }
            const typeName = this.getTypeName(inputValue[0]);
            if (typeName === InputArgument.TYPE_NUMBER) {
                return Math.max(...inputValue);
            }
            const elements = inputValue;
            let maxElement = elements[0];
            for (let i = 1; i < elements.length; i += 1) {
                if (maxElement.localeCompare(elements[i]) < 0) {
                    maxElement = elements[i];
                }
            }
            return maxElement;
        };
        this.functionMaxBy = (resolvedArgs) => {
            const exprefNode = resolvedArgs[1];
            const resolvedArray = resolvedArgs[0];
            const keyFunction = this.createKeyFunction(exprefNode, [InputArgument.TYPE_NUMBER, InputArgument.TYPE_STRING]);
            let maxNumber = -Infinity;
            let maxRecord;
            let current;
            for (let i = 0; i < resolvedArray.length; i += 1) {
                current = keyFunction && keyFunction(resolvedArray[i]);
                if (current !== undefined && current > maxNumber) {
                    maxNumber = current;
                    maxRecord = resolvedArray[i];
                }
            }
            return maxRecord;
        };
        this.functionMerge = resolvedArgs => {
            let merged = {};
            for (let i = 0; i < resolvedArgs.length; i += 1) {
                const current = resolvedArgs[i];
                merged = Object.assign(merged, current);
                // for (const key in current) {
                //   merged[key] = current[key];
                // }
            }
            return merged;
        };
        this.functionMin = ([inputValue]) => {
            if (!inputValue.length) {
                return null;
            }
            const typeName = this.getTypeName(inputValue[0]);
            if (typeName === InputArgument.TYPE_NUMBER) {
                return Math.min(...inputValue);
            }
            const elements = inputValue;
            let minElement = elements[0];
            for (let i = 1; i < elements.length; i += 1) {
                if (elements[i].localeCompare(minElement) < 0) {
                    minElement = elements[i];
                }
            }
            return minElement;
        };
        this.functionMinBy = (resolvedArgs) => {
            const exprefNode = resolvedArgs[1];
            const resolvedArray = resolvedArgs[0];
            const keyFunction = this.createKeyFunction(exprefNode, [InputArgument.TYPE_NUMBER, InputArgument.TYPE_STRING]);
            let minNumber = Infinity;
            let minRecord;
            let current;
            for (let i = 0; i < resolvedArray.length; i += 1) {
                current = keyFunction && keyFunction(resolvedArray[i]);
                if (current !== undefined && current < minNumber) {
                    minNumber = current;
                    minRecord = resolvedArray[i];
                }
            }
            return minRecord;
        };
        this.functionNotNull = (resolvedArgs) => {
            for (let i = 0; i < resolvedArgs.length; i += 1) {
                if (this.getTypeName(resolvedArgs[i]) !== InputArgument.TYPE_NULL) {
                    return resolvedArgs[i];
                }
            }
            return null;
        };
        this.functionReverse = ([inputValue]) => {
            const typeName = this.getTypeName(inputValue);
            if (typeName === InputArgument.TYPE_STRING) {
                const originalStr = inputValue;
                let reversedStr = '';
                for (let i = originalStr.length - 1; i >= 0; i -= 1) {
                    reversedStr += originalStr[i];
                }
                return reversedStr;
            }
            const reversedArray = inputValue.slice(0);
            reversedArray.reverse();
            return reversedArray;
        };
        this.functionSort = ([inputValue]) => {
            return [...inputValue].sort();
        };
        this.functionSortBy = (resolvedArgs) => {
            if (!this._interpreter) {
                return [];
            }
            const sortedArray = resolvedArgs[0].slice(0);
            if (sortedArray.length === 0) {
                return sortedArray;
            }
            const interpreter = this._interpreter;
            const exprefNode = resolvedArgs[1];
            const requiredType = this.getTypeName(interpreter.visit(exprefNode, sortedArray[0]));
            if (requiredType !== undefined && ![InputArgument.TYPE_NUMBER, InputArgument.TYPE_STRING].includes(requiredType)) {
                throw new Error(`TypeError: unexpected type (${this.TYPE_NAME_TABLE[requiredType]})`);
            }
            const decorated = [];
            for (let i = 0; i < sortedArray.length; i += 1) {
                decorated.push([i, sortedArray[i]]);
            }
            decorated.sort((a, b) => {
                const exprA = interpreter.visit(exprefNode, a[1]);
                const exprB = interpreter.visit(exprefNode, b[1]);
                if (this.getTypeName(exprA) !== requiredType) {
                    throw new Error(`TypeError: expected (${this.TYPE_NAME_TABLE[requiredType]}), received ${this.TYPE_NAME_TABLE[this.getTypeName(exprA)]}`);
                }
                else if (this.getTypeName(exprB) !== requiredType) {
                    throw new Error(`TypeError: expected (${this.TYPE_NAME_TABLE[requiredType]}), received ${this.TYPE_NAME_TABLE[this.getTypeName(exprB)]}`);
                }
                if (exprA > exprB) {
                    return 1;
                }
                return exprA < exprB ? -1 : a[0] - b[0];
            });
            for (let j = 0; j < decorated.length; j += 1) {
                sortedArray[j] = decorated[j][1];
            }
            return sortedArray;
        };
        this.functionStartsWith = ([searchable, searchStr]) => {
            return searchable.startsWith(searchStr);
        };
        this.functionSum = ([inputValue]) => {
            return inputValue.reduce((x, y) => x + y, 0);
        };
        this.functionToArray = ([inputValue]) => {
            if (this.getTypeName(inputValue) === InputArgument.TYPE_ARRAY) {
                return inputValue;
            }
            return [inputValue];
        };
        this.functionToNumber = ([inputValue]) => {
            const typeName = this.getTypeName(inputValue);
            let convertedValue;
            if (typeName === InputArgument.TYPE_NUMBER) {
                return inputValue;
            }
            if (typeName === InputArgument.TYPE_STRING) {
                convertedValue = +inputValue;
                if (!isNaN(convertedValue)) {
                    return convertedValue;
                }
            }
            return null;
        };
        this.functionToString = ([inputValue]) => {
            if (this.getTypeName(inputValue) === InputArgument.TYPE_STRING) {
                return inputValue;
            }
            return JSON.stringify(inputValue);
        };
        this.functionType = ([inputValue]) => {
            switch (this.getTypeName(inputValue)) {
                case InputArgument.TYPE_NUMBER:
                    return 'number';
                case InputArgument.TYPE_STRING:
                    return 'string';
                case InputArgument.TYPE_ARRAY:
                    return 'array';
                case InputArgument.TYPE_OBJECT:
                    return 'object';
                case InputArgument.TYPE_BOOLEAN:
                    return 'boolean';
                case InputArgument.TYPE_EXPREF:
                    return 'expref';
                case InputArgument.TYPE_NULL:
                    return 'null';
                default:
                    return;
            }
        };
        this.functionUpper = ([subject]) => {
            return upper(subject);
        };
        this.functionValues = ([inputObject]) => {
            return Object.values(inputObject);
        };
        this.functionTable = {
            abs: {
                _func: this.functionAbs,
                _signature: [
                    {
                        types: [InputArgument.TYPE_NUMBER],
                    },
                ],
            },
            avg: {
                _func: this.functionAvg,
                _signature: [
                    {
                        types: [InputArgument.TYPE_ARRAY_NUMBER],
                    },
                ],
            },
            ceil: {
                _func: this.functionCeil,
                _signature: [
                    {
                        types: [InputArgument.TYPE_NUMBER],
                    },
                ],
            },
            contains: {
                _func: this.functionContains,
                _signature: [
                    {
                        types: [InputArgument.TYPE_STRING, InputArgument.TYPE_ARRAY],
                    },
                    {
                        types: [InputArgument.TYPE_ANY],
                    },
                ],
            },
            ends_with: {
                _func: this.functionEndsWith,
                _signature: [
                    {
                        types: [InputArgument.TYPE_STRING],
                    },
                    {
                        types: [InputArgument.TYPE_STRING],
                    },
                ],
            },
            floor: {
                _func: this.functionFloor,
                _signature: [
                    {
                        types: [InputArgument.TYPE_NUMBER],
                    },
                ],
            },
            join: {
                _func: this.functionJoin,
                _signature: [
                    {
                        types: [InputArgument.TYPE_STRING],
                    },
                    {
                        types: [InputArgument.TYPE_ARRAY_STRING],
                    },
                ],
            },
            keys: {
                _func: this.functionKeys,
                _signature: [
                    {
                        types: [InputArgument.TYPE_OBJECT],
                    },
                ],
            },
            length: {
                _func: this.functionLength,
                _signature: [
                    {
                        types: [InputArgument.TYPE_STRING, InputArgument.TYPE_ARRAY, InputArgument.TYPE_OBJECT],
                    },
                ],
            },
            lower: {
                _func: this.functionLower,
                _signature: [
                    {
                        types: [InputArgument.TYPE_STRING],
                    },
                ],
            },
            map: {
                _func: this.functionMap,
                _signature: [
                    {
                        types: [InputArgument.TYPE_EXPREF],
                    },
                    {
                        types: [InputArgument.TYPE_ARRAY],
                    },
                ],
            },
            max: {
                _func: this.functionMax,
                _signature: [
                    {
                        types: [InputArgument.TYPE_ARRAY_NUMBER, InputArgument.TYPE_ARRAY_STRING],
                    },
                ],
            },
            max_by: {
                _func: this.functionMaxBy,
                _signature: [
                    {
                        types: [InputArgument.TYPE_ARRAY],
                    },
                    {
                        types: [InputArgument.TYPE_EXPREF],
                    },
                ],
            },
            merge: {
                _func: this.functionMerge,
                _signature: [
                    {
                        types: [InputArgument.TYPE_OBJECT],
                        variadic: true,
                    },
                ],
            },
            min: {
                _func: this.functionMin,
                _signature: [
                    {
                        types: [InputArgument.TYPE_ARRAY_NUMBER, InputArgument.TYPE_ARRAY_STRING],
                    },
                ],
            },
            min_by: {
                _func: this.functionMinBy,
                _signature: [
                    {
                        types: [InputArgument.TYPE_ARRAY],
                    },
                    {
                        types: [InputArgument.TYPE_EXPREF],
                    },
                ],
            },
            not_null: {
                _func: this.functionNotNull,
                _signature: [
                    {
                        types: [InputArgument.TYPE_ANY],
                        variadic: true,
                    },
                ],
            },
            reverse: {
                _func: this.functionReverse,
                _signature: [
                    {
                        types: [InputArgument.TYPE_STRING, InputArgument.TYPE_ARRAY],
                    },
                ],
            },
            sort: {
                _func: this.functionSort,
                _signature: [
                    {
                        types: [InputArgument.TYPE_ARRAY_STRING, InputArgument.TYPE_ARRAY_NUMBER],
                    },
                ],
            },
            sort_by: {
                _func: this.functionSortBy,
                _signature: [
                    {
                        types: [InputArgument.TYPE_ARRAY],
                    },
                    {
                        types: [InputArgument.TYPE_EXPREF],
                    },
                ],
            },
            starts_with: {
                _func: this.functionStartsWith,
                _signature: [
                    {
                        types: [InputArgument.TYPE_STRING],
                    },
                    {
                        types: [InputArgument.TYPE_STRING],
                    },
                ],
            },
            sum: {
                _func: this.functionSum,
                _signature: [
                    {
                        types: [InputArgument.TYPE_ARRAY_NUMBER],
                    },
                ],
            },
            to_array: {
                _func: this.functionToArray,
                _signature: [
                    {
                        types: [InputArgument.TYPE_ANY],
                    },
                ],
            },
            to_number: {
                _func: this.functionToNumber,
                _signature: [
                    {
                        types: [InputArgument.TYPE_ANY],
                    },
                ],
            },
            to_string: {
                _func: this.functionToString,
                _signature: [
                    {
                        types: [InputArgument.TYPE_ANY],
                    },
                ],
            },
            type: {
                _func: this.functionType,
                _signature: [
                    {
                        types: [InputArgument.TYPE_ANY],
                    },
                ],
            },
            upper: {
                _func: this.functionUpper,
                _signature: [
                    {
                        types: [InputArgument.TYPE_STRING],
                    },
                ],
            },
            values: {
                _func: this.functionValues,
                _signature: [
                    {
                        types: [InputArgument.TYPE_OBJECT],
                    },
                ],
            },
        };
        this._interpreter = interpreter;
    }
    registerFunction(name, customFunction, signature) {
        if (name in this.functionTable) {
            throw new Error(`Function already defined: ${name}()`);
        }
        this.functionTable[name] = {
            _func: customFunction.bind(this),
            _signature: signature,
        };
    }
    callFunction(name, resolvedArgs) {
        const functionEntry = this.functionTable[name];
        if (functionEntry === undefined) {
            throw new Error(`Unknown function: ${name}()`);
        }
        this.validateArgs(name, resolvedArgs, functionEntry._signature);
        return functionEntry._func.call(this, resolvedArgs);
    }
    validateInputSignatures(name, signature) {
        for (let i = 0; i < signature.length; i += 1) {
            if ('variadic' in signature[i] && i !== signature.length - 1) {
                throw new Error(`ArgumentError: ${name}() 'variadic' argument ${i + 1} must occur last`);
            }
        }
    }
    validateArgs(name, args, signature) {
        var _a, _b;
        let pluralized;
        this.validateInputSignatures(name, signature);
        const numberOfRequiredArgs = signature.filter(argSignature => { var _a; return (_a = !argSignature.optional) !== null && _a !== void 0 ? _a : false; }).length;
        const lastArgIsVariadic = (_b = (_a = signature[signature.length - 1]) === null || _a === void 0 ? void 0 : _a.variadic) !== null && _b !== void 0 ? _b : false;
        const tooFewArgs = args.length < numberOfRequiredArgs;
        const tooManyArgs = args.length > signature.length;
        const tooFewModifier = tooFewArgs && ((!lastArgIsVariadic && numberOfRequiredArgs > 1) || lastArgIsVariadic) ? 'at least ' : '';
        if ((lastArgIsVariadic && tooFewArgs) || (!lastArgIsVariadic && (tooFewArgs || tooManyArgs))) {
            pluralized = signature.length > 1;
            throw new Error(`ArgumentError: ${name}() takes ${tooFewModifier}${numberOfRequiredArgs} argument${(pluralized && 's') || ''} but received ${args.length}`);
        }
        let currentSpec;
        let actualType;
        let typeMatched;
        for (let i = 0; i < signature.length; i += 1) {
            typeMatched = false;
            currentSpec = signature[i].types;
            actualType = this.getTypeName(args[i]);
            let j;
            for (j = 0; j < currentSpec.length; j += 1) {
                if (actualType !== undefined && this.typeMatches(actualType, currentSpec[j], args[i])) {
                    typeMatched = true;
                    break;
                }
            }
            if (!typeMatched && actualType !== undefined) {
                const expected = currentSpec
                    .map((typeIdentifier) => {
                    return this.TYPE_NAME_TABLE[typeIdentifier];
                })
                    .join(' | ');
                throw new Error(`TypeError: ${name}() expected argument ${i + 1} to be type (${expected}) but received type ${this.TYPE_NAME_TABLE[actualType]} instead.`);
            }
        }
    }
    typeMatches(actual, expected, argValue) {
        if (expected === InputArgument.TYPE_ANY) {
            return true;
        }
        if (expected === InputArgument.TYPE_ARRAY_STRING ||
            expected === InputArgument.TYPE_ARRAY_NUMBER ||
            expected === InputArgument.TYPE_ARRAY) {
            if (expected === InputArgument.TYPE_ARRAY) {
                return actual === InputArgument.TYPE_ARRAY;
            }
            if (actual === InputArgument.TYPE_ARRAY) {
                let subtype;
                if (expected === InputArgument.TYPE_ARRAY_NUMBER) {
                    subtype = InputArgument.TYPE_NUMBER;
                }
                else if (expected === InputArgument.TYPE_ARRAY_STRING) {
                    subtype = InputArgument.TYPE_STRING;
                }
                for (let i = 0; i < argValue.length; i += 1) {
                    const typeName = this.getTypeName(argValue[i]);
                    if (typeName !== undefined && subtype !== undefined && !this.typeMatches(typeName, subtype, argValue[i])) {
                        return false;
                    }
                }
                return true;
            }
        }
        else {
            return actual === expected;
        }
        return false;
    }
    getTypeName(obj) {
        switch (Object.prototype.toString.call(obj)) {
            case '[object String]':
                return InputArgument.TYPE_STRING;
            case '[object Number]':
                return InputArgument.TYPE_NUMBER;
            case '[object Array]':
                return InputArgument.TYPE_ARRAY;
            case '[object Boolean]':
                return InputArgument.TYPE_BOOLEAN;
            case '[object Null]':
                return InputArgument.TYPE_NULL;
            case '[object Object]':
                if (obj.jmespathType === Token.TOK_EXPREF) {
                    return InputArgument.TYPE_EXPREF;
                }
                return InputArgument.TYPE_OBJECT;
            default:
                return;
        }
    }
    createKeyFunction(exprefNode, allowedTypes) {
        if (!this._interpreter) {
            return;
        }
        const interpreter = this._interpreter;
        const keyFunc = (x) => {
            const current = interpreter.visit(exprefNode, x);
            if (!allowedTypes.includes(this.getTypeName(current))) {
                const msg = `TypeError: expected one of (${allowedTypes
                    .map(t => this.TYPE_NAME_TABLE[t])
                    .join(' | ')}), received ${this.TYPE_NAME_TABLE[this.getTypeName(current)]}`;
                throw new Error(msg);
            }
            return current;
        };
        return keyFunc;
    }
}
//# sourceMappingURL=Runtime.js.map