# cells

a spreadsheet app with lisp-like formulas

https://github.com/user-attachments/assets/91fb52ce-916d-4057-9873-f488c9d88f87

## todo

### Basic Functionalities

- [ ] basic formulas
    - [x] arithmetic operations
    - [x] aggregation functions (e.g., `sum`, `mean`, etc.)
    - [ ] custom functions

- [ ] data types
    - [x] number
    - [x] text
    - [x] boolean
    - [ ] date

- [ ] data validation

### Functionalities for User Interaction

- [ ] cell formatting
    - [ ] text alignment (left, centre, right)
    - [ ] font size
    - [x] font style (bold, italic, underline, strikethrough)
    - [ ] cell background color

- [ ] general functionalities
    - [ ] copy + paste
    - [ ] undo + redo
    - [ ] select a range using mouse
    - [x] select cells individually using ctrl
    - [ ] select cells range with shift

### Advanced but Necessary Features

- [ ] construct an evaluation graph (_currently using observables to propagate value update_)
- [ ] circular dependency/cycle detection
- [ ] helpful error messages
- [ ] charts
- [ ] multiple sheets
- [ ] persist and load
- [ ] load from CSV/TSV, etc.
- [ ] load from JSON

### User Interface and Experience
 - [ ] minimal user interface
    - [ ] double shift to open a menu to do things like load, save, switch sheets etc.