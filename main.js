let TOTAL_ROW_COUNT = 100;
let TOTAL_COL_COUNT = 26;

const createCell = (id) => {
    return {
        id: id,
        data: undefined, // this is the raw data, can be a number, text or a formula
        computedValue: undefined,
        error: undefined,
        containsCycle: false,
        node: null,
        set: function(newData=null) {
            newData = newData ?? this.data
            this.data = newData

            if (newData && newData.startsWith("=")) {
                // we set a formula
                const text = newData.slice(1)
                const [_, references] = parse(lex(text))

                const resolvedDependendies = new Set()

                for (let ref of references) {
                    const [start, end] = ref.includes(":") ? ref.split(":") : [ref, ref]

                    const [sr, sc] = getCellPositionFromCoord(start)
                    const [er, ec] = getCellPositionFromCoord(end)
                    
                    let currentCol = sc

                    do {
                        for (let r = sr; r <= er; r++) {
                            resolvedDependendies.add(`${currentCol}${r}`)
                        }

                        if (currentCol === ec) {
                            break
                        }
                        currentCol = getColumnNumberFromName(currentCol)
                    } while(true);
                }

                const previousDependencies = [...this.dependencies]
                this.dependencies = [...resolvedDependendies]

                this.containsCycle = containsCycle(constructGraph(DATA_TABLE))

                // remove the previous dependencies from subscribers list
                for (const cell of previousDependencies) {
                    const [row, col] = getCellPositionFromCoord(cell)
                    const ix = DATA_TABLE[col][row].subscribers.indexOf(id)
                    if (ix > -1) {
                        DATA_TABLE[col][row].subscribers.splice(ix, 1)
                    }
                }
                
                // add the new dependencies to subscribers list
                for (const cell of this.dependencies) {
                    const [row, col] = getCellPositionFromCoord(cell)
                    DATA_TABLE[col][row].subscribers.push(id)
                }
            } else {
                // we set a scalar
                for (const cell of this.dependencies) {
                    const [row, col] = getCellPositionFromCoord(cell)
                    const ix = DATA_TABLE[col][row].subscribers.indexOf(id)
                    if (ix > -1) {
                        DATA_TABLE[col][row].subscribers.splice(ix, 1)
                    }
                }
                this.dependencies = []
                this.containsCycle = false;
            }
        },
        value: function() {
            if (this.error) {
                return new Error(this.error.message ?? "#ERROR")
            }
            return this.computedValue ?? this.data 
        },
        draw: function() {
            const v = this.value()
            if (v instanceof Error) {
                this.node.innerHTML = v.message;
            } else {
                this.node.innerHTML = v ? v : ""
            }

            this.node.style.backgroundColor = this.style.backgroundColor ?? "inherit";
            this.node.style.textColor = this.style.textColor ?? "inherit";
            this.node.style.textSize = this.style.textSize;
            this.node.style.fontWeight = this.style.isBold ? "bold" : "normal";
            this.node.style.fontStyle = this.style.isItalic ? "italic" : "normal"

            if (this.style.isSelected) {
                this.node.style.backgroundColor = "lightblue";
            }
        },
        computeAndPropagate: function() {
            if (this.containsCycle) {
                this.error = new Error("cycle detected")
                this.computedValue = undefined;
                this.draw()
                return;
            }

            let response = null
            if (this.data && this.data.startsWith("=")) {
                const text = this.data.slice(1)
                const [parsedExpression, _] = parse(lex(text))
                const [evalResponse, error] = eval(parsedExpression, DATA_TABLE); // TODO: handle errors
                if (error) {
                    this.error = error;
                    this.draw()
                    return;
                }
                response = evalResponse
            } else {
                response = this.data
            }

            // console.log(`[${this.id}] value ${this.computedValue} => ${response}`)

            this.computedValue = response;
            this.error = null;
            this.draw()

            for (let subscriber of this.subscribers) {
                const [row, col] = getCellPositionFromCoord(subscriber)
                DATA_TABLE[col][row].set()
                DATA_TABLE[col][row].computeAndPropagate()
            }
        },
        subscribers: [
            // cells that depend on this cell
        ],
        dependencies: [
            // cells that this cell depends on
        ],
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
            .map((_, row) => {
                return createCell(`${key}${row}`)
            })
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
                document.dispatchEvent(DRAW_EVENT)
            } else if (event.key === 'i') {
                for (let targetId of selectedCells) {
                    const [rowNum, colId] = getCellPositionFromId(targetId)
                    DATA_TABLE[colId][rowNum].style.isItalic = !DATA_TABLE[colId][rowNum].style.isItalic;
                }
                event.preventDefault()
                document.dispatchEvent(DRAW_EVENT)
            }
        } else {
            if (event.key === "Enter") {
                for (let targetId of selectedCells) {
                    document.getElementById(targetId).setAttribute("contenteditable", false);
                    let content = document.getElementById(targetId).innerText.trim()
                    content = content === "" ? undefined : content;
                    const [row, col] = getCellPositionFromId(targetId)
                    DATA_TABLE[col][row].set(content);
                    DATA_TABLE[col][row].computeAndPropagate()
                }
                event.preventDefault()
                document.dispatchEvent(DRAW_EVENT)
            }
        }
    }
})

function registerEventListenersForCell(cell) {
    cell.addEventListener("dblclick", (event) => {
        const [row, col] = getCellPositionFromId(event.target.id)
        const data = DATA_TABLE[col][row].data
        event.target.innerText = data ? data : ""
        event.target.setAttribute("contenteditable", true);
    });

    cell.addEventListener("input", (event) => {
        const id = event.target.id;
        const content = event.target.innerText;
        const [row, col] = getCellPositionFromId(id)
        DATA_TABLE[col][row].data = content === "" ? undefined : content;
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
                    const [rr, cc] = getCellPositionFromId(otherSelected)
                    DATA_TABLE[cc][rr].style.isSelected = false;
                    DATA_TABLE[cc][rr].draw()
                }
                selectedCells = [id];
            }
            DATA_TABLE[c][r].draw()
            document.dispatchEvent(DRAW_EVENT)
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
                if (v instanceof Error) {
                    cell.innerHTML = v.message;
                } else {
                    cell.innerHTML = v ? v : ""
                }

                DATA_TABLE[generateNextColumnName(c)][r].node = cell;
            }
        }
        ROOT_TABLE.appendChild(tr);
    }
}

document.addEventListener("draw", async function (event) {
    // await new Promise((resolve) => {
    //     redraw()
    //     resolve()
    // })
})

redraw()

// const multiarray = loadFakeCsvData()

// const colCount = multiarray[0].length;
// for (let c=0; c < colCount; c++) {
//     const colName = generateNextColumnName(c+1);
//     const columnData = DATA_TABLE[colName]

//     for (let r=0; r < multiarray.length; r++) {
//         columnData[r + 1].data = multiarray[r][c]
//     }
// }

// redraw()