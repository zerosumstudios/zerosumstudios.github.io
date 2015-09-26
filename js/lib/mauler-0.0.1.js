var mauler = {
    games: {},
    players: {},
    views: {},
    utils: {}
};

(function() {

    var CanvasPlayer = function(options) {
        this.moveChosen = null;
        this.match = options.match;
        this.canvasView = options.canvasView;
        this.canvas = options.canvasView.canvas;
        this.addListeners();
    };

    CanvasPlayer.prototype = {

        constructor: CanvasPlayer,

        move: function() {
            if (!this.moveChosen) {
                throw new Error("No move chosen!");
            }
            var selMove = this.moveChosen;
            this.moveChosen = null;
            return selMove;
        },

        // Listeners

        addListeners: function() {
            this.addClickListener();
            this.addMouseMoveListener();
            this.addMouseOutListener();
        },

        addClickListener: function () {
            this.canvas.addEventListener("click", function(event) {
                if (this.match.curGame().currentPlayer() === 0) {
                    var canvasLoc = mauler.utils.windowToCanvas(this.canvas, event.clientX, event.clientY);
                    var move = this.canvasView.canvasLocationToMove(canvasLoc);
                    var moves = this.match.curGame().moves();
                    if (_.contains(moves, move)) {
                        this.moveChosen = move;
                        this.match.next();
                        this.canvasView.render(); // TODO Move somewhere else?
                        this.match.next();
                        // TODO add trigger()?
                    }
                }
            }.bind(this));
        },

        addMouseMoveListener: function () {
            this.canvas.addEventListener("mousemove", function(event) {
                if (this.match.curGame().currentPlayer() === 0) {
                    var canvasLoc = mauler.utils.windowToCanvas(this.canvas, event.clientX, event.clientY);
                    var move = this.canvasView.canvasLocationToMove(canvasLoc);
                    var moves = this.match.curGame().moves();
                    if (_.contains(moves, move)) {
                        this.canvasView.highlightedMoves = [move];
                        this.canvasView.render();
                    }
                }
            }.bind(this));
        },

        addMouseOutListener: function () {
            this.canvas.addEventListener("mouseout", function() {
                this.canvasView.highlightedMoves = [];
                this.canvasView.render();
            }.bind(this));
        }

    };

    mauler.games.tic = mauler.games.tic || {};
    mauler.games.tic.CanvasPlayer = CanvasPlayer;

}());

(function() {

    var CanvasView = function(options) {
        this.model = options.model;
        this.canvas = options.canvas || document.createElement("canvas");
        this.canvas.width = options.width || 100;
        this.canvas.height = options.height || 100;
        this.ctx = this.canvas.getContext("2d");
        this.squareSize = this.canvas.width / this.model.size;
        this.cellPer = 0.7;
        this.colors = {
            bg: "rgb(255, 219, 122)",
            border: "rgb(229, 197, 110)",
            cross: "rgba(231, 76, 60, 1.0)",
            crossLight: "rgba(231, 76, 60, 0.5)",
            nought: "rgba(41, 128, 185,1.0)",
            noughtLight: "rgba(41, 128, 185, 0.5)"
        };
        this.highlightedMoves = [];
        this.borderSize = 0.02; // percentage
        this.linesWidth = Math.round(this.canvas.width * this.borderSize);
        this.render();
    };

    CanvasView.squareToMove = function(row, col) {
        return mauler.games.tic.letters[row] + (col + 1);
    };

    CanvasView.prototype = {

        constructor: CanvasView,

        render: function() {
            this.drawBackground();
            this.drawLines();
            this.drawBorder();
            this.drawSquares();
            return this.canvas;
        },

        getCurPlayerColor: function() {
            return this.model.currentPlayer() === 0 ? this.colors.crossLight : this.colors.noughtLight;
        },

        drawBackground: function() {
            this.ctx.fillStyle = this.colors.bg;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        },

        drawBorder: function() {
            this.ctx.beginPath();
            this.ctx.strokeStyle = this.colors.border;
            this.ctx.lineWidth = this.linesWidth;
            this.ctx.strokeRect(this.linesWidth / 2,
                    this.linesWidth / 2,
                    this.canvas.width - this.linesWidth,
                    this.canvas.height - this.linesWidth);
        },

        drawLines: function() {
            this.ctx.lineWidth = Math.round(this.canvas.width * this.borderSize);
            for (var i = 1; i < this.model.size; i++) {
                this.drawVerticalLine(i);
                this.drawHorizontalLine(i);
            }
        },

        drawSquares: function() {
            for (var row = 0; row < this.model.size; row++) {
                for (var col = 0; col < this.model.size; col++) {
                    var cellType = this.model.cell(row, col);
                    var hello = CanvasView.squareToMove(row, col);
                    if (cellType === 'CROSS') {
                        this.drawCross(row, col, this.colors.cross);
                    } else if (cellType === 'NOUGHT') {
                        this.drawNought(row, col, this.colors.nought);
                    } else if (!this.model.frozen && !this.model.isGameOver() && _.contains(this.highlightedMoves, hello)) {
                        var color = this.getCurPlayerColor();
                        if (this.model.currentPlayer() === 0) {
                            this.drawCross(row, col, color);
                        } else if (this.model.currentPlayer() === 1) {
                            this.drawNought(row, col, color);
                        }
                    }
                }
            }
        },

        drawHorizontalLine: function (row) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, row * this.squareSize);
            this.ctx.lineTo(this.canvas.width, row * this.squareSize);
            this.ctx.stroke();
        },

        drawVerticalLine: function (col) {
            this.ctx.strokeStyle = this.colors.border;
            this.ctx.beginPath();
            this.ctx.moveTo(col * this.squareSize, 0);
            this.ctx.lineTo(col * this.squareSize, this.canvas.height);
            this.ctx.stroke();
        },

        drawCross: function (row, col, color) {
            var space = this.squareSize * ((1 - this.cellPer)),
                x = col * this.squareSize,
                y = row * this.squareSize;

            this.ctx.lineWidth = this.linesWidth * 2; // TODO make it relative to size
            this.ctx.strokeStyle = color;
            this.ctx.lineCap = 'round';

            this.ctx.beginPath();

            // Top Left to Bottom Right
            this.ctx.moveTo(x + space, y + space);
            this.ctx.lineTo(x + this.squareSize - space, y + this.squareSize - space);

            // Bottom Left to Top Right
            this.ctx.moveTo(x + space, y + this.squareSize - space);
            this.ctx.lineTo(x + this.squareSize - space, y + space);

            this.ctx.stroke();
        },

        drawNought: function (row, col, color) {
            this.ctx.beginPath();
            var centerX = col * this.squareSize + (this.squareSize / 2),
                centerY = row * this.squareSize + (this.squareSize / 2),
                radius = this.squareSize / 2 * this.cellPer,
                startAngle = 0,
                endAngle = 2 * Math.PI,
                counterClockwise = false;
            this.ctx.arc(centerX, centerY, radius, startAngle, endAngle, counterClockwise);
            this.ctx.fillStyle = color;
            this.ctx.fill();
        },

        // Callbacks

        update: function(event, model) {
            this.model = model;
            this.render();
        },

        // Clickable

        coordToSquare: function(x, y) {
            return {
                row: Math.floor(y / this.squareSize),
                col: Math.floor(x / this.squareSize)
            };
        },

        canvasLocationToMove: function(loc) {
            var square = this.coordToSquare(loc.x, loc.y);
            return CanvasView.squareToMove(square.row, square.col);
        }

    };

    mauler.games.tic = mauler.games.tic || {};
    mauler.games.tic.CanvasView = CanvasView;

}());

(function() {

    var TicTacToe = function(options) {
        this.size = 3;
        this.crosses = 0;
        this.noughts = 0;
        options || (options = {});
        if (options.board) {
            this.setBoard(options.board);
        }
    };

    TicTacToe.PATTERNS = [7, 56, 448, 73, 146, 292, 273, 84];

    TicTacToe.prototype = {

        constructor: TicTacToe,

        ////////////////////////////
        // Mauler Game Interface  //
        ////////////////////////////

        copy: function() {
            var tic = new TicTacToe();
            tic.crosses = this.crosses;
            tic.noughts = this.noughts;
            return tic;
        },

        currentPlayer: function() {
            return (this.emptyCells() + 1) % 2;
        },

        isGameOver: function() {
            return this.numMoves() === 0;
        },

        move: function(move) {
            if (this.isGameOver()) {
                throw new Error("Can't make more moves, the game is over!");
            }
            // Make random move if no move given
            if (arguments.length === 0) {
                move = Math.floor(Math.random() * this.numMoves());
            } else if (typeof move === 'string') {
                var theMoves = this.moves();
                var nMoves = theMoves.length;
                for (var i = 0; i < nMoves; i++) {
                    if (move === theMoves[i]) {
                        move = i;
                        break;
                    }
                }
            }
            if (move < 0 || move >= this.numMoves()) { // TODO refactor, use move length
                throw new RangeError('Illegal move');
            }
            this.setCurBitboard(this.getCurBitboard() | (1 << this.legalMoves()[move]));
        },

        moves: function() {
            var mvs = [],
                legal = this.legalMoves();
            for (var i = 0; i < legal.length; i++) {
                var row = Math.floor(legal[i] / 3);
                var col = (legal[i] % 3) + 1;
                mvs.push(mauler.games.tic.letters[row] + col.toString());
            }
            return mvs
        },

        newGame: function() {
            return new TicTacToe();
        },

        // TODO no need for having this method... moves().length should be enough
        numMoves: function() {
            return this.isWin() ? 0 : this.emptyCells();
        },

        numPlayers: function() {
            return 2;
        },

        outcomes: function() {
            if (!this.isGameOver()) {
                return ['NA', 'NA'];
            }
            if (this.checkWin(this.crosses)) {
                return ['WIN', 'LOSS'];
            }
            if (this.checkWin(this.noughts)) {
                return ['LOSS', 'WIN'];
            }
            return ['DRAW', 'DRAW'];
        },

        reset: function() {
            this.crosses = 0;
            this.noughts = 0;
        },

        toString: function() {
            var builder = '';
            if (!this.isGameOver()) {
                builder += 'Player: ' + this.currentPlayer() + '\n';
                builder += 'Moves: ' + this.moves() + '\n';
            } else {
                builder += 'Game Over!\n';
            }
            builder += '\n';
            for (var i = 0; i < 9; i++) {
                if ((this.crosses & (1 << i)) !== 0) {
                    builder += ' X ';
                } else if ((this.noughts & (1 << i)) !== 0) {
                    builder += ' O ';
                } else {
                    builder += ' - ';
                }
                if (i % 3 === 2) {
                    builder += '\n';
                }
            }
            return builder;
        },

        //////////////////////////
        // Tic Tac Toe specific //
        //////////////////////////

        equals: function(other) {
            return this.crosses === other.crosses && this.noughts === other.noughts;
        },

        cellIndex: function(cellIndex) {
            if ((this.crosses & (1 << cellIndex)) !== 0) {
                return 'CROSS';
            }
            if ((this.noughts & (1 << cellIndex)) !== 0) {
                return 'NOUGHT';
            }
            return 'EMPTY';
        },

        cell: function(row, col) {
            return this.cellIndex(this.size * row + col);
        },

        isWin: function() {
            return this.checkWin(this.crosses) || this.checkWin(this.noughts);
        },

        emptyCells: function() {
            return 9 - this.bitCount(this.crosses | this.noughts);
        },

        bitCount: function(num) {
            var count = 0;
            for (var i = 0; i < 9; i++) {
                if ((num & (1 << i)) > 0) {
                    count++;
                }
            }
            return count;
        },

        legalMoves: function() {
            var moves = [];
            if (this.numMoves() > 0) {
                var legal = ~(this.crosses | this.noughts);
                for (var i = 0; i < 9; i++) {
                    if ((legal & (1 << i)) !== 0) {
                        moves.push(i);
                    }
                }
            }
            return moves;
        },

        checkWin: function(board) {
            for (var i = 0; i < TicTacToe.PATTERNS.length; i++) {
                if ((board & TicTacToe.PATTERNS[i]) === TicTacToe.PATTERNS[i]) {
                    return true;
                }
            }
            return false;
        },

        getCurBitboard: function() {
            return this.currentPlayer() === 0 ? this.crosses : this.noughts;
        },

        setCurBitboard: function(bitboard) {
            if (this.currentPlayer() === 0) {
                this.crosses = bitboard;
            } else {
                this.noughts = bitboard;
            }
        },

        setBoard: function(board) {
            for (var row = 0; row < board.length; row++) {
                for (var col = 0; col < board[row].length; col++) {
                    var value = board[row][col];
                    if (value === 'X') {
                        this.crosses |= (1 << ((row * this.size) + col));
                    } else if (value === 'O') {
                        this.noughts |= (1 << ((row * this.size) + col));
                    }
                }
            }
        }

    };

    mauler.games.tic = mauler.games.tic || {};
    mauler.games.tic.letters = ['A', 'B', 'C'];
    mauler.games.tic.TicTacToe = TicTacToe;

}());

(function() {

    var Match = function(options) {
        this.game = options.game;
        this.players = options.players;
        this.currentGameIndex = 0;
        this.reset();
    };

    Match.prototype = {

        constructor: Match,

        playToEnd: function() {
            while (this.isNext()) {
                this.next();
                this.trigger("fix", this.curGame());
            }
        },

        curGame: function() {
            return this.gameHistory[this.currentGameIndex];
        },

        setChange: function(index) {
            this.currentGameIndex = index;
            this.trigger("change", this.curGame());
        },

        getSize: function() {
            return this.gameHistory.length;
        },

        getCurrentIndex: function() {
            return this.currentGameIndex;
        },

        getGame: function(ply) {
            if (!ply) {
                return this.gameHistory[this.currentGameIndex];
            }
            return this.gameHistory[ply];
        },

        getMove: function(gameIndex) {
            return this.moveHistory[gameIndex];
        },

        isStart: function() {
            return this.currentGameIndex > 0;
        },

        isEnd: function() {
            return this.currentGameIndex < this.gameHistory.length - 1;
        },

        isOver: function() {
            return this.gameHistory[this.gameHistory.length - 1].isGameOver();
        },

        isNext: function() {
            return (this.currentGameIndex !== this.gameHistory.length - 1) ||
                (!this.gameHistory[this.gameHistory.length - 1].isGameOver());
        },

        isPrev: function() {
            return this.currentGameIndex > 0;
        },

        start: function() {
            if (this.isStart()) {
                this.currentGameIndex = 0;
                this.trigger("start", this.curGame());
            }
        },

        prev: function() {
            if (this.isPrev()) {
                this.currentGameIndex--;
                this.trigger("previous", this.curGame());
            }
        },

        copy: function() {

        },

        next: function() {
            if (!this.isNext()) {
                return;
            }
            var gameCopy = this.gameHistory[this.gameHistory.length - 1].copy();
            if (this.currentGameIndex === this.gameHistory.length - 1) {
                var moveIndex = this.players[gameCopy.currentPlayer()].move(gameCopy);
                var moveString = gameCopy.moves()[moveIndex];
                gameCopy.move(moveIndex);
                if (!this.gameHistory[this.gameHistory.length - 1].equals(gameCopy)) {
                    this.gameHistory.push(gameCopy);
                    this.moveHistory.push(moveString);
                    this.currentGameIndex++;
                    this.trigger("fix", this.curGame());
                }
            } else {
                this.currentGameIndex++;
                this.trigger("fix", this.curGame());
            }
        },

        end: function() {
            if (this.isEnd()) {
                this.currentGameIndex = this.gameHistory.length - 1;
                this.trigger("end", this.curGame());
            }
        },

        reset: function() {
            this.currentGameIndex = 0;
            this.moveHistory = [];
            this.gameHistory = [this.game.newGame()];
            this.trigger("reset", this.curGame());
        }

    };

    _.extend(Match.prototype, Backbone.Events);
    mauler.Match = Match;

}());

mauler.players.AlphaBeta = function(options) {
    options = options || {};
    this.maxDepth = options.maxDepth || Number.MAX_VALUE;
    this.utilFunc = options.utilFunc || mauler.utils.utilFunc;
};

mauler.players.AlphaBeta.prototype = {

    constructor: mauler.players.AlphaBeta,

    ab: function(game, curDepth, alpha, beta) {
        if (game.isGameOver() || curDepth === this.maxDepth) {
            return { move: -1, score: this.utilFunc(game, game.currentPlayer()) }; // TODO remove move? or change to null?
        }
        var bestMove = -1,
            bestScore = -Number.MAX_VALUE;
        for (var move = 0; move < game.numMoves(); move++) {
            var newGame = game.copy();
            newGame.move(move);
            var curMoveScore = this.ab(newGame, curDepth + 1, -beta, -Math.max(alpha, bestScore)),
                curScore = -curMoveScore.score;
            if (curScore > bestScore) {
                bestMove = move;
                bestScore = curScore;
                if (bestScore >= beta) {
                    return { move: bestMove, score: bestScore };
                }
            }
        }
        return { move: bestMove, score: bestScore };
    },

    move: function(game) {
        return this.ab(game.copy(), 0, -Number.MAX_VALUE, Number.MAX_VALUE).move;
    }

};

mauler.players.MCTS = function(options) {
    options = options || {};
    this.treePolicy = options.treePolicy;
    this.defaultPolicy = options.defaultPolicy;
    this.numSims = options.numSims;
    this.utilFunc = options.utilFunc || mauler.utils.utilFunc;
};

mauler.players.MCTS.prototype = {

    constructor: mauler.players.MCTS,

    copy: function() {
        return new mauler.MCTS(this.treePolicy, this.defaultPolicy, this.numSims);
    },

    simulate: function(curPos, player) {
        var visitedNodes = this.simTree(curPos, player),
            lastNode = visitedNodes[visitedNodes.length - 1],
            outcome = this.simDefault(lastNode, player);
        this.backup(visitedNodes, outcome);
    },

    simTree: function(curPos, player) {
        var nodes = [],
            curNode = curPos;
        while (!curNode.game.isGameOver()) {
            nodes.push(curNode);
            var lastNode = nodes[nodes.length - 1];
            if (lastNode.count === 0) {
                this.newNode(lastNode, player);
                return nodes;
            }
            var move = this.treePolicy.move(nodes[nodes.length - 1], player); // TODO refactor
            curNode = curNode.children[move];
        }
        nodes.push(curNode);
        return nodes;
    },

    simDefault: function(node, player) {
        var copy = node.game.copy();
        while (!copy.isGameOver()) {
            copy.move(this.defaultPolicy.move(copy));
        }
        return this.utilFunc(copy, player);
    },

    backup: function (visitedNodes, outcome) {
        visitedNodes.forEach(function(node) {
            node.update(outcome);
        });
    },

    newNode: function(node, player) { // todo remove this?
        node.init();
    },

    // Player Interface

    move: function(game) {
        game = game.copy();
        var root = new mauler.players.MCTSNode(game);
        var curPlayer = game.currentPlayer();
        for (var i = 0; i < this.numSims; i++) {
            this.simulate(root, curPlayer);
        }
        return this.treePolicy.move(root, curPlayer);
    }

};

mauler.players.MCTSNode = function(game) {
    this.game = game;
    this.count = 0;
    this.value = 0.0;
    this.children = [];
};

mauler.players.MCTSNode.prototype = {

    constructor: mauler.players.MCTSNode,

    init: function() {
        for (var move = 0; move < this.game.numMoves(); move++) {
            var newGame = this.game.copy();
            newGame.move(move);
            this.children.push(new mauler.players.MCTSNode(newGame));
        }
    },

    update: function(outcome) {
        this.count++;
        this.value += (outcome - this.value) / this.count;
    },

    actionCount: function(move) {
        return this.children[move].count; // TODO refactor
    },

    actionValue: function(move) {
        return this.children[move].value; // TODO refactor
    }

};

///////////////////
// Tree policies //
///////////////////

mauler.players.UCB1 = function(options) {
    options = options || {};
    this.c = options.c; // TODO add random number generator
};

mauler.players.UCB1.prototype = {

    constructor: mauler.players.UCB1,

    move: function(node, player) {
        var bestMove = -1,
            max = node.game.currentPlayer() === player,
            bestValue = max ? -Number.MAX_VALUE : Number.MAX_VALUE,
            nb = 0;
        for (var move = 0; move < node.game.numMoves(); move++) {
            nb += node.actionCount(move);
        }
        for (move = 0; move < node.game.numMoves(); move++) {
            var value = 0;

            // ensures that each arm is selected once before further exploration
            if (node.actionCount(move) === 0)
            {
                var bias = (Math.random() * 1000) + 10;
                value = max ? (100000000 - bias) : (-100000000 + bias); // TODO: refactor
            }
            else
            {
                var exploitation = node.actionValue(move);
                var exploration = this.c * Math.sqrt(Math.log(nb) / node.actionCount(move));
                value += exploitation;
                value += max ? exploration : -exploration;
            }

            if (max)
            {
                if (value > bestValue) {
                    bestMove = move;
                    bestValue = value;
                }
            }
            else if (value < bestValue) { // min
                bestMove = move;
                bestValue = value;
            }
        }
        return bestMove;
    }

};

mauler.players.Minimax = function(options) {
    options = options || {};
    this.maxDepth = options.maxDepth || Number.MAX_VALUE;
    this.utilFunc = options.utilFunc || mauler.utils.utilFunc;
};

mauler.players.Minimax.prototype = {

    constructor: mauler.players.Minimax,

    minimax: function(game, player, curDepth) {
        if (game.isGameOver() || curDepth === this.maxDepth) {
            return { move: -1, score: this.utilFunc(game, player) };
        }
        var bestMove = -1,
            bestScore = game.currentPlayer() === player ? -Number.MAX_VALUE : Number.MAX_VALUE;
        for (var move = 0; move < game.numMoves(); move++) { // TODO use 'n' variable
            var newGame = game.copy();
            newGame.move(move);
            var curMoveScore = this.minimax(newGame, player, curDepth + 1);
            if (game.currentPlayer() === player) {
                if (curMoveScore.score > bestScore) {
                    bestMove = move;
                    bestScore = curMoveScore.score;
                }
            } else if (curMoveScore.score < bestScore) {
                bestMove = move;
                bestScore = curMoveScore.score;
            }
        }
        return { move: bestMove, score: bestScore };
    },

    move: function(game) {
        return this.minimax(game.copy(), game.currentPlayer(), 0).move;
    }

};

mauler.players.MonteCarlo = function(options) {
    options = options || {};
    this.numSims = options.numSims || 5000;
    this.utilFunc = options.utilFunc || mauler.utils.utilFunc;
};

mauler.players.MonteCarlo.prototype = {

    constructor: mauler.players.MonteCarlo,

    move: function(game) {
        var numMoves = game.numMoves();
        if (numMoves === 1) {
            return 0;
        }
        var outcomes = Array.apply(null, new Array(numMoves)).map(Number.prototype.valueOf, 0);
        for (var i = 0; i < this.numSims; i++) {
            var newGame = game.copy(); // TODO refactor copy method
            var move = i % numMoves;
            newGame.move(move);
            while (!newGame.isGameOver()) {
                var randMove = Math.floor(Math.random() * newGame.numMoves());
                newGame.move(randMove);
            }
            outcomes[move] += this.utilFunc(newGame, game.currentPlayer());
        }
        return mauler.utils.argMax(outcomes);
    }

};

mauler.players.Negamax = function(options) {
    options = options || {};
    this.maxDepth = options.maxDepth || Number.MAX_VALUE;
    this.utilFunc = options.utilFunc || mauler.utils.utilFunc;
};

mauler.players.Negamax.prototype = {

    constructor: mauler.players.Negamax,

    negamax: function(game, curDepth) {
        if (game.isGameOver() || curDepth === this.maxDepth) {
            return { move: -1, score: this.utilFunc(game, game.currentPlayer()) };
        }
        var bestMove = -1,
            bestScore = -Number.MAX_VALUE;
        for (var move = 0; move < game.numMoves(); move++) { // TODO use 'n' variable
            var newGame = game.copy();
            newGame.move(move);
            var curMoveScore = this.negamax(newGame, curDepth + 1),
                curScore = -curMoveScore.score;
            if (curScore > bestScore) {
                bestMove = move;
                bestScore = curScore;
            }
        }
        return { move: bestMove, score: bestScore };
    },

    move: function(game) {
        return this.negamax(game.copy(), 0).move;
    }

};

mauler.players.Random = function() {

};

mauler.players.Random.prototype = {

    constructor: mauler.players.Random,

    move: function(game) {
        return Math.floor(Math.random() * game.numMoves());
    }

};

(function() {

    mauler.utils = mauler.utils || {};

    mauler.utils = {

        argMax: function(outcomes) {
            var maxArg = 0,
                maxValue = outcomes[0];
            for (var i = 1; i < outcomes.length; i++) {
                if (outcomes[i] > maxValue) {
                    maxArg = i;
                    maxValue = outcomes[i];
                }
            }
            return maxArg;
        },

        playRandomGame: function(game) {
            console.log(game.toString());
            while (!game.isGameOver()) {
                game.move();
                console.log(game.toString());
            }
        },

        playNGames: function(game, players, numGames) {
            var stats = {
                oneWins: 0,
                twoWins: 0,
                draws: 0
            };
            for (var i = 0; i < numGames; i++) {
                var newGame = game.copy();
                while (!newGame.isGameOver()) {
                    var curPlayer = players[newGame.currentPlayer()];
                    var move = curPlayer.move(newGame);
                    newGame.move(move);
                }
                var outcomes = newGame.outcomes();
                if (outcomes[0] === 'WIN') {
                    stats.oneWins++;
                } else if (outcomes[1] === 'WIN') {
                    stats.twoWins++;
                } else {
                    stats.draws++;
                }
            }
            return stats;
        },

        windowToCanvas: function(canvas, x, y) {
            var bbox = canvas.getBoundingClientRect();
            return {
                x: x - bbox.left * (canvas.width / bbox.width),
                y: y - bbox.top * (canvas.height / bbox.height)
            };
        },

        utilFunc: function(game, player) {
            if (game.isGameOver()) {
                var outcomes = game.outcomes();
                switch (outcomes[player]) {
                    case "WIN":
                        return 1.0;
                    case "DRAW":
                        return 0.0;
                    case "LOSS":
                        return -1.0;
                }
            }
        }

    };

}());

(function() {

    var ControlsView = function(options) {
        this.match = options.match;
        this.initElements();
        this.addListeners();
    };

    ControlsView.prototype = {

        constructor: ControlsView,

        initElements: function() {
            this.el = document.createElement("div");
            this.buttons = {
                start: document.createElement("button"),
                prev: document.createElement("button"),
                next: document.createElement("button"),
                end: document.createElement("button")
            };
            this.buttons.start.innerHTML = "|&#60;";
            this.buttons.prev.innerHTML = "&#60;";
            this.buttons.next.innerHTML = "&#62;";
            this.buttons.end.innerHTML = "&#62;|";
            this.el.appendChild(this.buttons.start);
            this.el.appendChild(this.buttons.prev);
            this.el.appendChild(this.buttons.next);
            this.el.appendChild(this.buttons.end);
        },

        addListeners: function () {
            this.buttons.start.addEventListener("click", function() {
                this.match.start();
            }.bind(this));
            this.buttons.prev.addEventListener("click", function() {
                this.match.prev();
            }.bind(this));
            this.buttons.next.addEventListener("click", function() {
                this.match.next();
            }.bind(this));
            this.buttons.end.addEventListener("click", function() {
                this.match.end();
            }.bind(this));
        },

        render: function() {
            return this.el;
        },

        update: function() {
            this.buttons.start.disabled = !this.match.isStart();
            this.buttons.prev.disabled = !this.match.isPrev();
            this.buttons.next.disabled = !this.match.isNext();
            this.buttons.end.disabled = !this.match.isEnd();
        }

    };

    mauler.views.ControlsView = ControlsView;

}());

(function() {

    var InfoView = function(options) {
        this.model = options.model;
        this.el = options.el;
        this.update(null, this.model);
    };

    InfoView.prototype = {

        constructor: InfoView,

        update: function(event, model) {
            this.model = model;
            if (this.model.isGameOver()) {
                var outcomes = this.model.outcomes();
                if (outcomes[0] === "WIN") {
                    this.el.innerHTML = "Player 1 Wins!";
                } else if (outcomes[1] === "WIN") {
                    this.el.innerHTML = "Player 2 Wins!";
                } else {
                    this.el.innerHTML = "Draw!";
                }
            } else {
                var curPlayer = this.model.currentPlayer() + 1;
                this.el.innerHTML = "Turn: Player " + curPlayer;
            }
        }

    };

    mauler.views.InfoView = InfoView;

}());

(function() {

    var RestartView = function(options) {
        this.match = options.match;
        this.el = options.el;
        this.update();
        this.addListener();
    };

    RestartView.prototype = {

        constructor: RestartView,

        addListener: function () {
            this.el.addEventListener("click", function() {
                this.match.reset();
            }.bind(this));
        },

        // Match Events

        update: function() {
            this.el.disabled = !this.match.isStart();
        }

    };

    mauler.views.RestartView = RestartView;

}());