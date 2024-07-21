const binaryOperation = (lambda) => {
    return (args, context) => {
        const a = eval(args[0], context) // should be a number
        const b = eval(args[1], context) // should be a number
        return lambda(a, b)
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
        for (let arr of eval(args[0], context)) {
            result += arr.reduce((acc, n) => acc + parseFloat(n), 0)
        }
        return result
    },
    "mean": function(args, context) {
        let result = 0
        let count = 0
        // assumption is that the first arg is a multi-array range
        for (let arr of eval(args[0], context)) {
            result += arr.reduce((acc, n) => acc + parseFloat(n), 0)
            count += arr.length
        }
        return result / count
    },
    "mode": function(args, context) {

    },
    "count": function(args, context) {
        let count = 0
        // assumption is that the first arg is a multi-array range
        for (let arr of eval(args[0], context)) {
            count += arr.length
        }
        return count
    },
    "if": function(args, context) {
        // if <condition> <true> <false>
        const condition = args[0]
        const success = args[1]
        const fail = args[2]
        if (eval(condition, context) == true) {
            return eval(success, context)
        }
        return eval(fail, context)
    },
    "min": function(args, context) {
        let globalMin = Infinity
        // assumption is that the first arg is a multi-array range
        for (let arr of eval(args[0], context)) {
            const localMin = arr.reduce((min, n) => Math.min(min, n), Infinity)
            globalMin = Math.min(globalMin, localMin)
        }
        return globalMin
    },
    "max": function(args, context) {
        let globalMax = -Infinity
        // assumption is that the first arg is a multi-array range
        for (let arr of eval(args[0], context)) {
            const localMax = arr.reduce((max, n) => Math.max(max, n), -Infinity)
            globalMax = Math.max(globalMax, localMax)
        }
        return globalMax
    },
    "__range__": function(args, context) {
        const [sr, sc] = getCellPositionFromCoord(args[0].value)
        const [er, ec] = getCellPositionFromCoord(args[1].value)
        const result = []
        let currentCol = sc
        do {
            result.push(context[currentCol].slice(sr, er+1).map(cell => cell.data))
            if (currentCol === ec) {
                break
            }
            currentCol = getColumnNumberFromName(currentCol)
        } while(true);
        return result
    },
}

function eval(expression, context) {
    const {value, type} = expression;

    if (type === DataType.Expr) {
        const [func, ...args] = value
        if (func.type && func.type === DataType.Expr) {
            return eval(func, context)
        }
        return eval(func)(args, context)
    } else if (type === DataType.Function) {
        return BUILT_IN_FUNCTIONS_MAP[value]
    } else if (type === DataType.Text) {
        return value
    } else if (type === DataType.Number) {
        return value
    } else if (type === DataType.Boolean) {
        return value
    } else if (type === DataType.Reference) {
        // resolve it using context
        const [row, column] = getCellPositionFromCoord(value)
        return context[column][row].value();
    } else {
        console.error(`unrecognized expression type: ${type} (${value}) (${expression})`)
    }
}