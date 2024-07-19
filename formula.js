const BinaryOperators = [
    "+",
    "-",
    "*",
    "/",
    "^",
    "=",
    ">",
    ">=", // won't match in lexing because it's one char at a time
    "<",
    "<=", // won't match in lexing because it's one char at a time
    ":",
]

const BUILT_IN_FUNCTIONS = [
    "+",
    "-",
    "*",
    "/",
    "^",
    "=",
    ">",
    ">=", // won't match in lexing because it's one char at a time
    "<",
    "<=", // won't match in lexing because it's one char at a time
    "<>", // won't match in lexing because it's one char at a time
    "sum",
    "mean",
    "mode",
    "count",
    "if",
    "min",
    "max",
    "__range__",
]

const TokenType = {
    LiteralString: "LiteralString",
    LiteralNumber: "LiteralNumber",
    Ident: "Ident",
    LParen: "LParen",
    RParen: "RParen",
}

const DataType = {
    Number: "Number",
    Text: "Text",
    Boolean: "Boolean",
    Function: "Function",
    Reference: "Reference",
    Expr: "Expression",
}

const createToken = (tokenType, value) => {
    return {
        tokenType: tokenType,
        value: value
    }    
}

function isAlpha(ch) {
    if (!ch) return false
    const ascii = ch.charCodeAt(0)
    return (ascii >= 65 && ascii <= 90) || (ascii >= 97 && ascii <= 122);
}

function isDigit(ch) {
    if (!ch) return false
    const ascii = ch.charCodeAt(0)
    return ascii >= 48 && ascii <= 57;
}

function lexString(data) {
    let string = ""
    while (data.adv() != `"`) {
        string += data.cur()
    }
    return createToken(
        TokenType.LiteralString,
        string
    )
}

// TODO: doesn't handle negative or floating point numbers or any other format
function lexNumber(data) {
    let numberString = ""
    
    while (isDigit(data.cur())) {
        numberString += data.cur()
        data.adv()
    }

    if (data.cur() != null) {
        data.back()
    }

    return createToken(
        TokenType.LiteralNumber,
        parseInt(numberString)
    )
}

function lex(input) {
    const data = {
        input: input,
        pos: -1,
        adv: function() {
            this.pos += 1;
            if (this.pos >= this.input.length) {
                return null
            }
            return this.input[this.pos];
        },
        cur: function() {
            if (this.pos >= this.input.length) {
                return null
            }

            return this.input[this.pos];
        },
        back: function() {
            this.pos -= 1
            if (this.pos < 0) {
                return null
            }
            return this.input[this.pos];
        }
    }

    const tokens = []

    while (data.adv()) {
        const ch = data.cur()

        if (`"` === ch) {
            const t = lexString(data)
            tokens.push(t)
        } else if ("(" === ch || ")" === ch) {
            const tokenType = ch === "(" ? TokenType.LParen : TokenType.RParen
            tokens.push(createToken(
                tokenType,
                ch
            ))
        } else if (" " === ch || "\n" === ch || "\t" === ch) {
            // TODO: we have bundle more together
            // tokens.push(createToken(
            //     TokenType.WS,
            //     ch
            // ))
        } else if (parseInt(ch)) {
            const t = lexNumber(data)
            tokens.push(t)
        } else {
            let identString = ""
            // TODO: improve this, we might not need these checks at all
            while (isAlpha(data.cur()) || isDigit(data.cur()) || BinaryOperators.includes(data.cur())) {
                identString += data.cur()
                data.adv()
            }
            if (data.cur() != null) {
                data.back()
            }
            tokens.push(createToken(
                TokenType.Ident,
                identString
            ))
        }
    }

    return tokens
}

function parseExpression(data) {
    if (!data.cur() || (data.cur().tokenType !== TokenType.LParen)) {
        return []
    }

    const expressions = []

    const createExpression = (value, type) => {
        return {
            value: value,
            type: type
        }
    }

    while (data.adv().tokenType != TokenType.RParen) {
        const token = data.cur()
        const tokenType = token.tokenType;

        if (tokenType === TokenType.LParen) {
            const subexpr = parseExpression(data)
            expressions.push(subexpr)
        } else {
            if (tokenType === TokenType.LiteralNumber) {
                expressions.push(
                    createExpression(
                        parseInt(token.value),
                        DataType.Number
                    )
                )
            } else if (tokenType === TokenType.LiteralString) {
                expressions.push(
                    createExpression(
                        token.value,
                        DataType.Text
                    )
                )
            } else if (tokenType === TokenType.Ident) {
                if (token.value.includes(":")) {
                    // this is a range
                    const [s, e] = token.value.split(":")
                    expressions.push(
                        createExpression(
                            [
                                createExpression(
                                    "__range__",
                                    DataType.Function
                                ),
                                createExpression(
                                    s,
                                    DataType.Reference
                                ),
                                createExpression(
                                    e,
                                    DataType.Reference
                                )
                            ],
                            DataType.Expr
                        )
                    )
                } else if (["true", "false"].includes(token.value)) {
                    expressions.push(
                        createExpression(
                            token.value === "true",
                            DataType.Boolean
                        )
                    )
                } else if (BUILT_IN_FUNCTIONS.includes(token.value)) {
                    expressions.push(
                        createExpression(
                            token.value,
                            DataType.Function
                        )
                    )
                } else {
                    expressions.push(
                        createExpression(
                            token.value,
                            DataType.Reference
                        )
                    )
                }
            }
        }
    }
    return createExpression(
        expressions,
        DataType.Expr
    )
}

function parse(tokens) {
    const data = {
        input: tokens,
        pos: 0,
        adv: function() {
            this.pos += 1;
            if (this.pos >= this.input.length) {
                return null
            }
            return this.input[this.pos];
        },
        cur: function() {
            if (this.pos >= this.input.length) {
                return null
            }

            return this.input[this.pos];
        },
        back: function() {
            this.pos -= 1
            if (this.pos < 0) {
                return null
            }
            return this.input[this.pos];
        }
    }

    try {
        return parseExpression(data)
    } catch (error) {
        console.error(`Parsing error`, error)
        return []        
    }
}
