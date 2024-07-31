const binaryOperation = (lambda) => {
    return (args, context) => {
        const [a, errorA] = eval(args[0], context) // should be a number
        const [b, errorB] = eval(args[1], context) // should be a number

        if (hasValue(a) && hasValue(b)) {
            const x = parseFloat(a)
            const y = parseFloat(b)
            return [lambda(x, y), null]
        } else {
            const errorMessage = [errorA?.message, errorB?.message].filter(m => m != undefined).join(", ")
            return [null, new Error(errorMessage)]
        }
    }
}

const getCellPositionFromCoord = (coord) => {
    const column = [...coord].filter(isAlpha).join("")
    const row = parseInt([...coord].filter(isDigit).join(""))
    return [row, column]
}

const BUILT_IN_FUNCTIONS_MAP = {
    "+": binaryOperation((a,b) => a + b),
    "-": binaryOperation((a,b) => a - b),
    "*": binaryOperation((a,b) => a * b),
    "/": binaryOperation((a,b) => a / b),
    "^": binaryOperation((a,b) => a ** b),
    "=": binaryOperation((a,b) => a === b), // TODO: interesting
    ">": binaryOperation((a,b) => a > b),
    ">=": binaryOperation((a,b) => a >= b), 
    "<": binaryOperation((a,b) => a < b),
    "<=": binaryOperation((a,b) => a <= b), 
    "<>": binaryOperation((a,b) => a !== b), 
    "sum": function(args, context) {
        let result = 0
        // assumption is that the first arg is a multi-array range
        const [array, error] = eval(args[0], context)
        if (error) {
            return [null, error]
        }

        for (let arr of array) {
            result += arr.reduce((acc, n) => acc + parseFloat(n), 0) // TODO: parseFloat can fail too
        }
        return [result, null]
    },
    "mean": function(args, context) {
        let result = 0
        let count = 0
        // assumption is that the first arg is a multi-array range
        const [array, error] = eval(args[0], context)
        if (error) {
            return [null, error]
        }
        for (let arr of array) {
            result += arr.reduce((acc, n) => acc + parseFloat(n), 0)
            count += arr.length
        }
        return [result / count, null]
    },
    "mode": function(args, context) {
        return [0, null]
    },
    "count": function(args, context) {
        let count = 0
        // assumption is that the first arg is a multi-array range
        const [array, error] = eval(args[0], context)
        if (error) {
            return [null, error]
        }
        for (let arr of array) {
            count += arr.length
        }
        return [count, null]
    },
    "if": function(args, context) {
        // if <condition> <true> <false>
        const condition = args[0]
        const success = args[1]
        const fail = args[2]
        const [conditionResult, error] = eval(condition, context)
        if (error) {
            return [null, error]
        }
        if (conditionResult == true) {
            return eval(success, context)
        }
        return eval(fail, context)
    },
    "min": function(args, context) {
        let globalMin = Infinity
        // assumption is that the first arg is a multi-array range
        const [array, error] = eval(args[0], context)
        if (error) {
            return [null, error]
        }
        for (let arr of array) {
            const localMin = arr.reduce((min, n) => Math.min(min, n), Infinity)
            globalMin = Math.min(globalMin, localMin)
        }
        return [globalMin, null]
    },
    "max": function(args, context) {
        let globalMax = -Infinity
        // assumption is that the first arg is a multi-array range
        const [array, error] = eval(args[0], context)
        if (error) {
            return [null, error]
        }
        for (let arr of array) {
            const localMax = arr.reduce((max, n) => Math.max(max, n), -Infinity)
            globalMax = Math.max(globalMax, localMax)
        }
        return [globalMax, null]
    },
    "__range__": function(args, context) {
        const [sr, sc] = getCellPositionFromCoord(args[0].value)
        const [er, ec] = getCellPositionFromCoord(args[1].value)
        const result = []
        let currentCol = sc
        do {
            result.push(context[currentCol].slice(sr, er+1).map(cell => cell.computedValue))
            if (currentCol === ec) {
                break
            }
            currentCol = getColumnNumberFromName(currentCol)
        } while(true);
        return [result, null]
    },
}

function eval(expression, context) {
    const {value, type} = expression;

    if (type === DataType.Expr) {
        const [func, ...args] = value
        if (func.type && func.type === DataType.Expr) {
            return eval(func, context)
        }
        const [executable, error] = eval(func)
        if (error) {
            return [null, error]
        }
        return executable(args, context)
    } else if (type === DataType.Function) {
        const func = BUILT_IN_FUNCTIONS_MAP[value]
        if (func) {
            return [func, null]
        }
        return [null, new Error(`${value} function does not exist`)]
    } else if (type === DataType.Text) {
        return [value, null]
    } else if (type === DataType.Number) {
        return [value, null]
    } else if (type === DataType.Boolean) {
        return [value, null]
    } else if (type === DataType.Reference) {
        // resolve it using context
        const [row, column] = getCellPositionFromCoord(value)
        const response = context[column][row].value();
        if (response instanceof Error) {
            return [null, response]
        }

        if (response == undefined) {
            return [null, new Error(`${value} is undefined`)]
        }

        return [response, null]
    } else {
        console.error(`unrecognized expression type: ${type} (${value}) (${expression})`)
        return [null, new Error("formula parsing error")]
    }
}