let TOTAL_ROW_COUNT = 100;
let TOTAL_COL_COUNT = 26;

const createCell = (ignored) => {
    return {
        data: undefined, // this is the raw data, can be a number, text or a formula
        value: function() {
            if (this.data && this.data.startsWith("=")) {
                const text = this.data.slice(1)
                return eval(parse(lex(text)), DATA_TABLE); // TODO: handle errors
            }
            return this.data
        },
        style: {
            backgroundColor: undefined,
            textColor: undefined,
            textSize: 16, // this is px
            isBold: false,
            isItalic: false,
            isSelected: false,
        }
    }
}

const createDataTable = (rowCount, colCount) => {
    const tableObj = {}
    
    for (let c = 1; c <= colCount; c++) {
        const key = generateNextColumnName(c)
        tableObj[key] = new Array(rowCount + 1) // to make it 1-based index
            .fill(null)   
            .map(createCell)
    }
    
    return tableObj;
}

const ROOT_TABLE = document.getElementById("root_table");
const DATA_TABLE = createDataTable(TOTAL_ROW_COUNT, TOTAL_COL_COUNT);
let selectedCells = []

document.addEventListener("keydown", (event) => {
    if (selectedCells.length > 0) {
        if (event.ctrlKey) {
            if (event.key === 'b') {
                for (let targetId of selectedCells) {
                    const [rowNum, colId] = getCellPositionFromId(targetId)
                    DATA_TABLE[colId][rowNum].style.isBold = !DATA_TABLE[colId][rowNum].style.isBold;
                }
                event.preventDefault()
                redraw()
            } else if (event.key === 'i') {
                for (let targetId of selectedCells) {
                    const [rowNum, colId] = getCellPositionFromId(targetId)
                    DATA_TABLE[colId][rowNum].style.isItalic = !DATA_TABLE[colId][rowNum].style.isItalic;
                }
                event.preventDefault()
                redraw()
            }
        } else {
            if (event.key === "Enter") {
                for (let targetId of selectedCells) {
                    document.getElementById(targetId).setAttribute("contenteditable", false);
                    let text = document.getElementById(targetId).innerText.trim()
                    const [row, col] = getCellPositionFromId(targetId)
                    DATA_TABLE[col][row].data = text;
                }
                redraw()
                event.preventDefault()
            }
        }
    }
})

function registerEventListenersForCell(cell) {
    const handleCellContentChange = debounce((id, content) => {
        const [row, col] = getCellPositionFromId(id)
        DATA_TABLE[col][row].data = content;
    });

    
    cell.addEventListener("dblclick", (event) => {
        const [row, col] = getCellPositionFromId(event.target.id)
        const data = DATA_TABLE[col][row].data
        event.target.innerText = data ? data : ""
        event.target.setAttribute("contenteditable", true);
    });

    cell.addEventListener("input", (event) => {
        const id = event.target.id;
        const content = event.target.innerText;
        handleCellContentChange(id, content)
    })

    cell.addEventListener("click", (event) => {
        const id = event.target.id
        if (!selectedCells.includes(id)) {
            let [r, c] = getCellPositionFromId(id)
            DATA_TABLE[c][r].style.isSelected = true
            if (event.ctrlKey) {
                selectedCells.push(id);
            } else {
                for (let otherSelected of selectedCells) {
                    const [r, c] = getCellPositionFromId(otherSelected)
                    DATA_TABLE[c][r].style.isSelected = false;
                }
                selectedCells = [id];
            }
            redraw();
        }
    })

}

function redraw() {
    ROOT_TABLE.innerHTML = ""
    for (let r = 0; r <= TOTAL_ROW_COUNT; r++) {
        const tr = document.createElement("tr")
        tr.className = "row"
        tr.id = `r${r}`
        for (let c = 0; c <= TOTAL_COL_COUNT; c++) {
            const cellType = (r === 0 || c === 0) ? "th" : "td";
            const cell = document.createElement(cellType);
            cell.className = "cell"
            cell.id = `${r}-${c}`
            tr.appendChild(cell);
            if (c === 0 && r !== 0) {
                cell.innerHTML = `${r}`
            } else if (r === 0) {
                cell.innerHTML = generateNextColumnName(c);
            } else {
                cell.setAttribute("contenteditable", false);
                registerEventListenersForCell(cell)
                const datum = DATA_TABLE[generateNextColumnName(c)][r];
                
                const st = datum.style;
                
                cell.style.backgroundColor = st.backgroundColor ?? "inherit";
                cell.style.textColor = st.textColor ?? "inherit";
                cell.style.textSize = st.textSize;
                cell.style.fontWeight = st.isBold ? "bold" : "normal";
                cell.style.fontStyle = st.isItalic ? "italic" : "normal"

                if (st.isSelected) {
                    cell.style.backgroundColor = "lightblue";
                }
                
                const v = datum.value()
                cell.innerHTML = v ? v : ""
            }
        }
        ROOT_TABLE.appendChild(tr);
    }
}

redraw()

const data = loadFakeCsvData()

data.then(multiarray => {
    const colCount = multiarray[0].length;
    for (let c=0; c < colCount; c++) {
        const colName = generateNextColumnName(c+1);
        const columnData = DATA_TABLE[colName]

        for (let r=0; r < multiarray.length; r++) {
            columnData[r + 1].data = multiarray[r][c]
        }
    }

    redraw()
})