# cells

a spreadsheet app with lisp-like formulas

https://github.com/user-attachments/assets/d96d71a8-bd03-4001-a5c4-994fce659f3c

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
    - [x] select a range using mouse
    - [x] select cells individually using ctrl
    - [ ] select cells range with shift

### Advanced Features

- [x] circular dependency/cycle detection
- [x] helpful error messages
- [ ] charts
- [ ] multiple sheets
- [ ] persist and load
- [x] load from CSV/TSV, etc.
- [ ] load from JSON

### User Interface and Experience
 - [ ] minimal user interface
    - [ ] double shift to open a menu to do things like load, save, switch sheets etc.

## built in functions

```sh
# arithmetic
=(+ 10 A1) # add
=(- 10 A2) # sub
=(* 10 A2) # mult
=(/ 10 A2) # div
=(^ 10 A2) # pow
# comparison
=(= 10 A2) # equality check
=(> 10 A2) # greater than
=(>= 10 A2) # greater than equal
=(< 10 A2) # less than
=(<= 10 A2) # less than equal
=(<> 10 A2) # not equal
# aggregation
=(sum A1:B10) # sums the range
=(mean A1:B10) # finds mean value in the range
=(mode A1:B10) # finds mode value in the range (not implemented yet)
=(count A1:B10) # finds the number of elements in the range
=(min A1:B10) # finds the minimum value in the range
=(max A1:B10) # finds the maximum value in the range
# conditionals
=(if condition resultTrue resultFalse) # conditional value
=(if (> A1 10) 100 200) # if example
=(if (> A1 10) "hi" "bye") # if example
```