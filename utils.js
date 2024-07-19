async function loadFakeCsvData() {
    const resp = await fetch(`/mock_data.csv`)
    const text = await resp.text()
    const data = []
    const lines = text.split("\n")

    for (let r = 0; r < lines.length; r++) {
        const dataPerLine = lines[r].split(",")
        data.push(dataPerLine)
    }

    return data;
}

const generateNextColumnName = (colNum) => {
    if (!colNum || colNum <= 0) {
        return ""
    }

    let response = ""
    do {
        colNum -= 1
        const base = Math.floor(colNum / 26);
        const remainder = colNum % 26;
        const suffix = String.fromCharCode(65 + remainder)
        response = suffix + response
        colNum = base;
    } while(colNum != 0);

    return response;
}

const generateNextColumnNameRecursive = (colNum) => {
    if (colNum === 0) {
        return ""
    }

    colNum -= 1

    const base = Math.floor(colNum / 26);
    const remainder = colNum % 26;
    const suffix = String.fromCharCode(65 + remainder)
    const prefix = generateNextColumnName(base);

    return `${prefix}${suffix}`
}

const getCellPositionFromId = (id) => {
    const [rowNum, colNum] = id.split("-").map(s => parseInt(s))

    return [
        rowNum,
        generateNextColumnName(colNum)
    ]
}

function debounce(func, timeout = 500) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}
