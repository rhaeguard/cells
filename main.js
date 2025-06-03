const createCell = (id) => {
    return {
        id: id,
        data: undefined, // this is the raw data, can be a number, text or a formula
        computedValue: undefined,
        error: undefined,
        containsCycle: false,
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
        draw: function(node) {
            const v = this.value()
            if (v instanceof Error) {
                node.innerHTML = v.message;
            } else {
                node.innerHTML = v ? v : ""
            }

            node.style.backgroundColor = this.style.backgroundColor ?? "inherit";
            node.style.textColor = this.style.textColor ?? "inherit";
            node.style.textSize = this.style.textSize;
            node.style.fontWeight = this.style.isBold ? "bold" : "normal";
            node.style.fontStyle = this.style.isItalic ? "italic" : "normal"

            if (this.style.isSelected) {
                node.style.backgroundColor = "lightblue";
            }
        },
        computeAndPropagate: function() {
            if (this.containsCycle) {
                this.error = new Error("cycle detected")
                this.computedValue = undefined;
                return;
            }

            let response = null
            if (this.data && this.data.startsWith("=")) {
                const text = this.data.slice(1)
                const [parsedExpression, _] = parse(lex(text))
                const [evalResponse, error] = eval(parsedExpression, DATA_TABLE); // TODO: handle errors
                if (error) {
                    this.error = error;
                    return;
                }
                response = evalResponse
            } else {
                response = this.data
            }

            this.computedValue = response;
            this.error = null;

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


let TOTAL_ROW_COUNT = 100;
let TOTAL_COL_COUNT = 26;

const ROOT_TABLE = document.getElementById("root_table");
const ROOT_THEAD = document.getElementById("thead")
const ROOT_TBODY = document.getElementById("tbody")

const VLINE = document.getElementById('vline');

let DATA_TABLE = createDataTable(TOTAL_ROW_COUNT, TOTAL_COL_COUNT);

// state variables
const innerHeight = window.innerHeight;
const ROW_HEIGHT = 25;
const ROW_COUNT = Math.floor(innerHeight / ROW_HEIGHT) - 1
let STARTING_ROW = 0
let selectedCells = []
let mouseDownState = {
    value: false,
    selectedCells: {
        start: null,
        end: null
    }
};
// state variables end

function setEndOfContenteditable(elem) {
    let sel = window.getSelection();
    sel.selectAllChildren(elem);
    sel.collapseToStart();
}

document.addEventListener("keydown", (event) => {
    if (selectedCells.length > 0) {
        if (event.ctrlKey) {
            if (event.key === 'b') {
                for (let targetId of selectedCells) {
                    const [rowNum, colId] = getCellPositionFromId(targetId)
                    const targetEl = document.getElementById(targetId) 
                    DATA_TABLE[colId][rowNum].style.isBold = !DATA_TABLE[colId][rowNum].style.isBold;
                    DATA_TABLE[colId][rowNum].draw(targetEl)
                }
                event.preventDefault()
            } else if (event.key === 'i') {
                for (let targetId of selectedCells) {
                    const [rowNum, colId] = getCellPositionFromId(targetId)
                    const targetEl = document.getElementById(targetId) 
                    DATA_TABLE[colId][rowNum].style.isItalic = !DATA_TABLE[colId][rowNum].style.isItalic;
                    DATA_TABLE[colId][rowNum].draw(targetEl)
                }
                event.preventDefault()
            }
        } else {
            if (event.key === "Enter") {
                for (let targetId of selectedCells) {
                    const targetEl = document.getElementById(targetId) 
                    setEndOfContenteditable(targetEl)
                    targetEl.contentEditable = false;
                    let content = targetEl.innerText.trim()
                    content = content === "" ? undefined : content;
                    const [rowNum, colId] = getCellPositionFromId(targetId)
                    DATA_TABLE[colId][rowNum].set(content);
                    DATA_TABLE[colId][rowNum].computeAndPropagate()
                    DATA_TABLE[colId][rowNum].draw(targetEl)
                }
                event.preventDefault()
            }
        }
    }
})

function registerEventListenersForCell(cell) {
    cell.addEventListener("dblclick", (event) => {
        const [row, col] = getCellPositionFromId(event.target.id)
        const data = DATA_TABLE[col][row].data
        event.target.innerText = data ? data : ""
        event.target.contentEditable = true;
    });

    cell.addEventListener("input", (event) => {
        const id = event.target.id;
        const content = event.target.innerText;
        const [row, col] = getCellPositionFromId(id)
        DATA_TABLE[col][row].data = content === "" ? undefined : content;
    })

    cell.addEventListener("mousedown", (event) => {
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
                    const td = document.getElementById(otherSelected)
                    if (td) {
                        DATA_TABLE[cc][rr].draw(td)
                    }
                }
                selectedCells = [id];
            }
            DATA_TABLE[c][r].draw(event.target)
        }
        mouseDownState.value = true;
        mouseDownState.selectedCells.start = id;
        mouseDownState.selectedCells.end = id;
    })

    function selectDeselectCells(isSelected) {
        let {start, end} = mouseDownState.selectedCells;
        end = end == null ? start : end

        let [sr, sc] = start.split("-").map(s => parseInt(s))
        let [er, ec] = end.split("-").map(s => parseInt(s))

        let [_sr, _er] = sr <= er ? [sr, er] : [er, sr]; 
        let [_sc, _ec] = sc <= ec ? [sc, ec] : [ec, sc]; 

        for (let c = _sc; c <= _ec; c++) {
            const cc = generateNextColumnName(c)
            const column = DATA_TABLE[cc]
            for (let r = _sr; r <= _er; r++) {
                const id = `${r}-${c}`
                column[r].style.isSelected = isSelected;
                const td = document.getElementById(id)
                if (td) {
                    column[r].draw(td)
                }
                if (isSelected == true) {
                    selectedCells.push(id)
                } else {
                    selectedCells = selectedCells.filter(sc => sc != id)
                }
            }
        }
    }

    cell.addEventListener("mouseup", (event) => {
        mouseDownState.value = false;
        mouseDownState.selectedCells.start = null;
        mouseDownState.selectedCells.end = null;
    })

    cell.addEventListener("mouseover", (event) => {
        if (mouseDownState.value == true) {
            selectDeselectCells(false);
            const id = event.target.id
            mouseDownState.selectedCells.end = id;
            selectDeselectCells(true);
        }
        
    })

}

function drawBlankTable() {
    const row = document.createElement("tr")
    const cols = []
    for(let c=0; c <= TOTAL_COL_COUNT; c++) {
        const th = document.createElement("th")
        const colName = generateNextColumnName(c)
        const resizer = document.createElement("div")
        resizer.className = "resizer"
        th.innerText = colName
        th.style.minWidth = `100px`
        th.style.overflow = "hidden"
        th.appendChild(resizer)
        cols.push(th)

        let startX, startWidth;

        resizer.addEventListener('mousedown', (e) => {
            startX = e.pageX;
            startWidth = th.offsetWidth;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        function onMouseMove(e) {
            VLINE.style.display = "block";
            VLINE.style.left = `${e.clientX}px`;
        }

        function onMouseUp(e) {
            const tableWidth = ROOT_TABLE.offsetWidth;

            const diff = e.pageX - startX
            const newWidth = startWidth + diff;
            
            ROOT_TABLE.style.width = `${tableWidth + diff}px`;
            th.style.width = `${newWidth}px`;
            th.style.maxWidth = `${newWidth}px`;

            VLINE.style.display = "none";

            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
    }
    row.append(...cols)
    ROOT_THEAD.appendChild(row)

    const rows = []
    for(let r=1; r < ROW_COUNT; r++) {
        const row = document.createElement("tr")
        row.style.height = `${ROW_HEIGHT}px`
        const cols = []
        for(let c=0; c <= TOTAL_COL_COUNT; c++) {
            if (c === 0) {
                const th = document.createElement("th")
                cols.push(th)
            } else {
                const td = document.createElement("td")
                registerEventListenersForCell(td)
                cols.push(td)
            }
        }
        row.append(...cols)
        rows.push(row)
    }
    ROOT_TBODY.append(...rows)
}



function rerenderRows(startingRow = 0) {
    const rows = ROOT_TBODY.querySelectorAll("tr")
    for(let r=1; r < ROW_COUNT; r++) {
        const row = rows.item(r-1)
        row.className = "row"
        row.id = `r${r+startingRow}`
        const cols = row.querySelectorAll("td,th")
        for(let c=0; c <= TOTAL_COL_COUNT; c++) {
            const td = cols.item(c)
            const colName = generateNextColumnName(c)
            if (c === 0) {
                td.innerText = `${r+startingRow}`
            } else {
                td.contentEditable = false;
                const v = DATA_TABLE[colName][r+startingRow]
                v.draw(td)
                td.id = `${r+startingRow}-${c}`
            }
        }
    }
}

function loadData(multiarray) {
    const colCount = multiarray[0].length;
    for (let c=0; c < colCount; c++) {
        const colName = generateNextColumnName(c+1);
        const columnData = DATA_TABLE[colName]

        for (let r=0; r < multiarray.length; r++) {
            columnData[r + 1].data = multiarray[r][c]
        }
    }
}

document.addEventListener('keydown', function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'o') {
        event.preventDefault();

        // Create and trigger an invisible file input
        const input = document.createElement('input');
        input.type = 'file';
        input.style.display = 'none';

        input.onchange = function (ignored) {
            const file = input.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const contents = e.target.result;
                    const lines = contents.split("\n");
                    const multiarray = lines.slice(0, TOTAL_ROW_COUNT).map(line => line.split(",").slice(0, TOTAL_COL_COUNT))
                    loadData(multiarray)
                    rerenderRows(0)
                };
                reader.readAsText(file);
            }
        };

        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    }
});

document.addEventListener("wheel", (ev) => {
    STARTING_ROW += Math.floor(ev.deltaY / ROW_HEIGHT)
    STARTING_ROW = STARTING_ROW < 0 ? 0 : STARTING_ROW
    STARTING_ROW = STARTING_ROW + ROW_COUNT >= TOTAL_ROW_COUNT ? TOTAL_ROW_COUNT - ROW_COUNT : STARTING_ROW
    rerenderRows(STARTING_ROW)
})

drawBlankTable()
rerenderRows(0)