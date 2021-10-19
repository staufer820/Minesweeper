
class Game {
    constructor(difficulty) {
        this.difficulty = difficulty;
        this.board = null;
        switch (this.difficulty) {
            case "0": this.board = new Board(5, 5);
            break;

            case "1": this.board = new Board(10, 15);
            break;

            case "2": this.board = new Board(15, 30);
            break;
        }
    }
}

class Board {
    constructor(size, bombs) {
        this.size = size;
        this.numberOfBombs = bombs;

        this.fields = [];

        for (let i = 0; i < this.size; i++) {
            let fields_i = [];
            for (let j = 0; j < this.size; j++) {
                let field = new Field(i, j);
                fields_i.push(field);
            }
            this.fields.push(fields_i);
        }
        this.setBombs();
    }

    getEmptyFieldCoordinates(){
        return [...this.fields].map((r,y)=>r.map((c,x)=>{
            return c.isBomb ? null : {x:x, y:y}
        })).reduce((a,b)=>[...a, ...b], []).filter(c=>c);
    }

    setBombs() {
        for (let i = 0; i < this.numberOfBombs; i++) {
            let coords = this.getEmptyFieldCoordinates();
            coords = coords[Math.floor(Math.random()*coords.length)];
            this.fields[coords.y][coords.x].isBomb = true;
        }
    }

    getField(r, c) {
        let field;
        this.fields.forEach(fs => {
            fs.forEach(f => {
                if (f.row == r && f.column == c) field = f;
            })
        })
        return field;
    }
}

class Field {
    constructor(row, column) {
        this.row = row;
        this.column = column;
        this.isBomb = false;
        this.uncovered = false;
        this.flagSet = false;
    }

    getBombsAround(board) {
        let bombCounter = 0;
        for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
                if (this.row + i < 0 || this.row + i >= board.size || this.column + j < 0 || this.column + j >= board.size || (i == 0 && j == 0)) continue;
                if (board.fields[this.row+i][this.column+j].isBomb) bombCounter++;
            }
        }
        return (bombCounter > 0) ? bombCounter : "";
    }
}

let gameover = false;

function startGame() {
    gameover = false;
    document.getElementById('win').innerText = "";
    let hasGame = document.querySelector("table");
    if (hasGame) hasGame.remove();
    let select = document.getElementById("selectDifficulty");
    let game = new Game(select.value);

    let table = document.createElement("table");
    document.getElementById("game").append(table);

    for (let i = 0; i < game.board.size; i++) {
        let tr = document.createElement("tr");
        table.append(tr);
        for (let j = 0; j < game.board.size; j++) {
            let td = document.createElement("td");
            td.classList = "field";
            td.style.width = (400/game.board.size) + "px";
            td.style.height = (400/game.board.size) + "px";
            td.style.fontSize = ((400/game.board.size)-10) + "px";
            td.setAttribute("row", i);
            td.setAttribute("column", j);
            td.addEventListener("click", function() {
                openField(game.board, td);
            });
            td.oncontextmenu = function(event) {
                event.preventDefault();
                if (!gameover) setFlag(game.board, td);
            }
            tr.append(td);
        }
    }
    setBombsLeft(game.board);
    openEmptyField(game.board);
}

function setFlag(board, td) {
    let r = td.getAttribute("row"), c = td.getAttribute("column");
    let field = board.getField(r, c);
    if (!field.uncovered) {
        if (!field.flagSet) td.className = "flag";
        else td.className = "field";
        field.flagSet = !field.flagSet;
        setBombsLeft(board);
    }
}

function setBombsLeft(board) {
    let bombsLeft = document.getElementById("bombsLeft");
    let counter = 0;
    board.fields.forEach(fs => {
        fs.forEach(f => {
            if (f.flagSet) counter++;
        })
    })

    bombsLeft.innerText = (board.numberOfBombs - counter);
}

function openField(board, td) {
    let row = td.getAttribute("row"), col = td.getAttribute("column");
    let field = board.getField(row, col);
    if (!field.uncovered && !gameover && !field.flagSet) {
        field.uncovered = true;
        if (field.isBomb) {
            gameover = true;
            td.classList = "failed";
            openAllBombs(board);
        } else {
            td.className = "noBomb";
            td.innerText = field.getBombsAround(board);
            if (field.getBombsAround(board) == "") openFieldsAround(field, board);
            checkWin(board);
        }
    }
}

function checkWin(board) {
    let counter = 0;
    board.fields.forEach(fs => {
        fs.forEach(f => {
            if (f.uncovered && !f.isBomb) counter++;
        })
    })
    if (counter == board.size*board.size - board.numberOfBombs) {
        gameover = true;
        startEndAnimation();
    }
}

function startEndAnimation() {
    let win = document.getElementById("win");
    win.style.opacity = 0;
    win.innerText = "Gewonnen!";
    let opacity = 0;
    let interval = setInterval(function () {
        if (opacity < 100) {
            opacity++;
            win.style.opacity = opacity/100;
        } else {
            clearInterval(interval);
        }
    }, 20);
}

function openFieldsAround(field, board) {
    for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
            if (field.row + i < 0 || field.row + i >= board.size || field.column + j < 0 || field.column + j >= board.size || (i == 0 && j == 0)) continue;
            let f = board.fields[field.row+i][field.column+j];
            let td = document.querySelector(`td.field[row='${f.row}'][column='${f.column}']`);
            if (!f.uncovered) openField(board, td);
        }
    }
}

function openAllBombs(board) {
    let bombs = [];
    for (let i = 0; i < board.size; i++) {
        for (let j = 0; j < board.size; j++) {
            if (board.getField(i, j).isBomb && !board.getField(i, j).uncovered) bombs.push(board.getField(i, j));
        }
    }

    randomSort(bombs);

    let index = 0;
    let interval = setInterval(function () {
        if (index < bombs.length) {
            bombs[index].uncovered = true;
            let r = bombs[index].row, c = bombs[index].column;
            if (!bombs[index].flagSet) {
                let td = document.querySelector(`td.field[row='${r}'][column='${c}']`);
                td.className = "failed";
            } else {
                let td = document.querySelector(`td.flag[row='${r}'][column='${c}']`);
                td.className = "failed";
            }
            document.getElementById("start").setAttribute("disabled", true);
            document.getElementById("start").style.backgroundColor = "gray";
            index++;
        } else {
            document.getElementById("start").removeAttribute("disabled");
            document.getElementById("start").style.backgroundColor = "cadetblue";
            clearInterval(interval);
        }
    }, 100);

    document.getElementById("win").innerText = "Verloren!";
    document.getElementById("win").className = "lose";
}

function randomSort(array) {
    for (let i = 0; i < array.length; i++) {
        let rand = Math.floor(Math.random()*array.length);
        let tempi = array[i];
        let tempj = array[rand];
        array[i] = tempj;
        array[rand] = tempi;
    }
}

function openEmptyField(board) {
    let emptyfields = [];
    board.fields.forEach(fs => {
        fs.forEach(f => {
            if (f.getBombsAround(board) == "" && !f.isBomb) {
                emptyfields.push(f);
            }
        })
    })
    randomSort(emptyfields);
    let r = emptyfields[0];
    let td = document.querySelector(`td.field[row='${r.row}'][column='${r.column}']`);
    openField(board, td);
}

startGame();