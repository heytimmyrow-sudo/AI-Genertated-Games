(function () {
  const boardElement = document.getElementById("boardArcadeBoard");
  const overlayElement = document.getElementById("boardArcadeOverlay");
  const titleElement = document.getElementById("boardArcadeTitle");
  const messageElement = document.getElementById("boardArcadeMessage");
  const modeElement = document.getElementById("boardArcadeMode");
  const difficultyElement = document.getElementById("boardArcadeDifficulty");
  const hintElement = document.getElementById("boardArcadeHint");
  const restartButton = document.getElementById("restartBoardArcade");
  const topSideElement = document.getElementById("boardArcadeTopSide");
  const bottomSideElement = document.getElementById("boardArcadeBottomSide");

  if (!boardElement) return;

  const state = {
    game: "chess",
    mode: "pvp",
    difficulty: "easy",
    paused: false,
    currentPlayer: "white",
    winner: null,
    selected: null,
    legalMoves: [],
    board: [],
    waitingForComputer: false,
    endReason: ""
  };

  const chessIcons = {
    white: { king: "\u2654", queen: "\u2655", rook: "\u2656", bishop: "\u2657", knight: "\u2658", pawn: "\u2659" },
    black: { king: "\u265A", queen: "\u265B", rook: "\u265C", bishop: "\u265D", knight: "\u265E", pawn: "\u265F" }
  };

  const chessPieceValues = {
    pawn: 100,
    knight: 320,
    bishop: 330,
    rook: 500,
    queen: 900,
    king: 20000
  };

  function returnToMenu() {
    if (window.top && window.top !== window) {
      window.top.postMessage({ type: "codex-menu-exit" }, window.location.origin);
      return;
    }
    window.location.href = "../index.html";
  }

  function inBounds(row, col, size) {
    return row >= 0 && row < size && col >= 0 && col < size;
  }

  function cloneBoard(board) {
    return board.map((row) => row.map((piece) => (piece ? { ...piece } : null)));
  }

  function getModeLabel() {
    return state.mode === "pvp" ? "Mode: Player vs Player" : "Mode: Player vs Computer";
  }

  function getDifficultyLabel() {
    return "Difficulty: " + state.difficulty.charAt(0).toUpperCase() + state.difficulty.slice(1);
  }

  function getModeColor(piece) {
    return piece.color || piece;
  }

  function opponentOf(color) {
    if (color === "white") return "black";
    if (color === "black") return "white";
    if (color === "red") return "black";
    if (color === "x") return "o";
    return "red";
  }

  function buildChessBoard() {
    const back = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"];
    const board = Array.from({ length: 8 }, () => Array(8).fill(null));

    for (let col = 0; col < 8; col += 1) {
      board[0][col] = { color: "black", type: back[col] };
      board[1][col] = { color: "black", type: "pawn" };
      board[6][col] = { color: "white", type: "pawn" };
      board[7][col] = { color: "white", type: back[col] };
    }

    return board;
  }

  function buildCheckersBoard() {
    const board = Array.from({ length: 8 }, () => Array(8).fill(null));
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        if ((row + col) % 2 === 1 && row < 3) {
          board[row][col] = { color: "black", type: "checker", king: false };
        } else if ((row + col) % 2 === 1 && row > 4) {
          board[row][col] = { color: "red", type: "checker", king: false };
        }
      }
    }
    return board;
  }

  function buildTicTacToeBoard() {
    return Array.from({ length: 3 }, () => Array(3).fill(null));
  }

  function buildTitlesAndHints() {
    const titles = {
      chess: "Chess",
      checkers: "Checkers",
      tictactoe: "Tic-Tac-Toe"
    };

    const hints = {
      chess: "White starts at the bottom, black starts at the top. Checkmate ends the game.",
      checkers: "Red starts at the bottom, black starts at the top. Captures are forced when available.",
      tictactoe: "Build three in a row before the computer or the other player does."
    };

    titleElement.textContent = titles[state.game];
    modeElement.textContent = getModeLabel();
    difficultyElement.textContent = getDifficultyLabel();
    hintElement.textContent = hints[state.game];

    if (state.game === "chess") {
      topSideElement.textContent = "Black Side";
      bottomSideElement.textContent = "White Side";
    } else if (state.game === "checkers") {
      topSideElement.textContent = "Black Side";
      bottomSideElement.textContent = "Red Side";
    } else {
      topSideElement.textContent = "Top Row";
      bottomSideElement.textContent = "Bottom Row";
    }
  }

  function updateStatus(customMessage) {
    buildTitlesAndHints();

    if (customMessage) {
      messageElement.textContent = customMessage;
      return;
    }

    if (state.winner) {
      if (state.winner === "draw") {
        messageElement.textContent = state.endReason || "Draw game.";
      } else {
        messageElement.textContent = state.winner + " wins" + (state.endReason ? " by " + state.endReason + "." : ".");
      }
      return;
    }

    if (state.game === "chess") {
      const checked = isKingInCheck(state.board, state.currentPlayer);
      messageElement.textContent = (state.currentPlayer === "white" ? "White" : "Black") +
        (checked ? " to move. Check." : " to move.");
      return;
    }

    const turnLabel = {
      red: "Red to move.",
      black: "Black to move.",
      x: "X to move.",
      o: "O to move."
    };
    messageElement.textContent = turnLabel[state.currentPlayer];
  }

  function resetGame() {
    state.paused = false;
    state.selected = null;
    state.legalMoves = [];
    state.winner = null;
    state.waitingForComputer = false;
    state.endReason = "";

    if (state.game === "chess") {
      state.currentPlayer = "white";
      state.board = buildChessBoard();
    } else if (state.game === "checkers") {
      state.currentPlayer = "red";
      state.board = buildCheckersBoard();
    } else {
      state.currentPlayer = "x";
      state.board = buildTicTacToeBoard();
    }

    updateStatus();
    renderBoard();
    maybeComputerTurn();
  }

  function isComputerTurn() {
    if (state.mode !== "pvc" || state.winner) return false;
    if (state.game === "chess") return state.currentPlayer === "black";
    if (state.game === "checkers") return state.currentPlayer === "black";
    return state.currentPlayer === "o";
  }

  function findKing(board, color) {
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const piece = board[row][col];
        if (piece && piece.color === color && piece.type === "king") {
          return { row, col };
        }
      }
    }
    return null;
  }

  function collectChessPseudoMoves(board, row, col, attackOnly) {
    const piece = board[row][col];
    if (!piece) return [];
    const moves = [];

    function addRay(dRow, dCol) {
      let nextRow = row + dRow;
      let nextCol = col + dCol;
      while (inBounds(nextRow, nextCol, 8)) {
        const target = board[nextRow][nextCol];
        if (!target) {
          moves.push({ row: nextRow, col: nextCol });
        } else {
          if (target.color !== piece.color && target.type !== "king") {
            moves.push({ row: nextRow, col: nextCol, capture: true });
          }
          break;
        }
        nextRow += dRow;
        nextCol += dCol;
      }
    }

    if (piece.type === "pawn") {
      const direction = piece.color === "white" ? -1 : 1;
      const startRow = piece.color === "white" ? 6 : 1;

      if (!attackOnly && inBounds(row + direction, col, 8) && !board[row + direction][col]) {
        moves.push({ row: row + direction, col: col });
        if (row === startRow && !board[row + direction * 2][col]) {
          moves.push({ row: row + direction * 2, col: col });
        }
      }

      for (const deltaCol of [-1, 1]) {
        const targetRow = row + direction;
        const targetCol = col + deltaCol;
        if (!inBounds(targetRow, targetCol, 8)) continue;
        if (attackOnly) {
          moves.push({ row: targetRow, col: targetCol, capture: true });
        } else {
          const target = board[targetRow][targetCol];
          if (target && target.color !== piece.color && target.type !== "king") {
            moves.push({ row: targetRow, col: targetCol, capture: true });
          }
        }
      }
      return moves;
    }

    if (piece.type === "knight") {
      const jumps = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ];
      for (const jump of jumps) {
        const targetRow = row + jump[0];
        const targetCol = col + jump[1];
        if (!inBounds(targetRow, targetCol, 8)) continue;
        const target = board[targetRow][targetCol];
        if (!target) {
          moves.push({ row: targetRow, col: targetCol });
        } else if (target.color !== piece.color && target.type !== "king") {
          moves.push({ row: targetRow, col: targetCol, capture: true });
        }
      }
      return moves;
    }

    if (piece.type === "king") {
      for (let dRow = -1; dRow <= 1; dRow += 1) {
        for (let dCol = -1; dCol <= 1; dCol += 1) {
          if (dRow === 0 && dCol === 0) continue;
          const targetRow = row + dRow;
          const targetCol = col + dCol;
          if (!inBounds(targetRow, targetCol, 8)) continue;
          const target = board[targetRow][targetCol];
          if (!target) {
            moves.push({ row: targetRow, col: targetCol });
          } else if (target.color !== piece.color && target.type !== "king") {
            moves.push({ row: targetRow, col: targetCol, capture: true });
          }
        }
      }
      return moves;
    }

    if (piece.type === "rook" || piece.type === "queen") {
      addRay(-1, 0);
      addRay(1, 0);
      addRay(0, -1);
      addRay(0, 1);
    }
    if (piece.type === "bishop" || piece.type === "queen") {
      addRay(-1, -1);
      addRay(-1, 1);
      addRay(1, -1);
      addRay(1, 1);
    }

    return moves;
  }

  function isSquareAttacked(board, row, col, byColor) {
    for (let r = 0; r < 8; r += 1) {
      for (let c = 0; c < 8; c += 1) {
        const piece = board[r][c];
        if (!piece || piece.color !== byColor) continue;
        const attacks = collectChessPseudoMoves(board, r, c, true);
        if (attacks.some((move) => move.row === row && move.col === col)) {
          return true;
        }
      }
    }
    return false;
  }

  function applyChessMoveToBoard(board, move) {
    const nextBoard = cloneBoard(board);
    const piece = nextBoard[move.from.row][move.from.col];
    nextBoard[move.from.row][move.from.col] = null;
    nextBoard[move.to.row][move.to.col] = piece;
    if (piece.type === "pawn" && (move.to.row === 0 || move.to.row === 7)) {
      piece.type = "queen";
    }
    return nextBoard;
  }

  function isKingInCheck(board, color) {
    const king = findKing(board, color);
    if (!king) return false;
    return isSquareAttacked(board, king.row, king.col, opponentOf(color));
  }

  function collectChessMoves(board, row, col) {
    const piece = board[row][col];
    if (!piece) return [];

    const pseudo = collectChessPseudoMoves(board, row, col, false);
    return pseudo.filter((move) => {
      const nextBoard = applyChessMoveToBoard(board, { from: { row: row, col: col }, to: move });
      return !isKingInCheck(nextBoard, piece.color);
    });
  }

  function collectCheckersMoves(board, row, col) {
    const piece = board[row][col];
    if (!piece) return [];
    const directions = [];
    if (piece.color === "red" || piece.king) directions.push([-1, -1], [-1, 1]);
    if (piece.color === "black" || piece.king) directions.push([1, -1], [1, 1]);

    const moves = [];
    const captures = [];

    for (const direction of directions) {
      const stepRow = row + direction[0];
      const stepCol = col + direction[1];
      const jumpRow = row + direction[0] * 2;
      const jumpCol = col + direction[1] * 2;

      if (inBounds(stepRow, stepCol, 8) && !board[stepRow][stepCol]) {
        moves.push({ row: stepRow, col: stepCol });
      } else if (
        inBounds(jumpRow, jumpCol, 8) &&
        board[stepRow][stepCol] &&
        board[stepRow][stepCol].color !== piece.color &&
        !board[jumpRow][jumpCol]
      ) {
        captures.push({ row: jumpRow, col: jumpCol, capture: true, jumped: { row: stepRow, col: stepCol } });
      }
    }

    return captures.length ? captures : moves;
  }

  function hasCheckersCapture(color) {
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const piece = state.board[row][col];
        if (piece && piece.color === color) {
          const moves = collectCheckersMoves(state.board, row, col);
          if (moves.some((move) => move.capture)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  function getLegalMoves(row, col, board, currentPlayer) {
    const activeBoard = board || state.board;
    const activePlayer = currentPlayer || state.currentPlayer;

    if (state.game === "chess") {
      return collectChessMoves(activeBoard, row, col);
    }

    if (state.game === "checkers") {
      const moves = collectCheckersMoves(activeBoard, row, col);
      if (hasCheckersCapture(activePlayer)) {
        return moves.filter((move) => move.capture);
      }
      return moves;
    }

    if (activeBoard[row][col]) return [];
    return [{ row: row, col: col }];
  }

  function evaluateTicTacToe(board) {
    const lines = [];
    for (let i = 0; i < 3; i += 1) {
      lines.push([[i, 0], [i, 1], [i, 2]]);
      lines.push([[0, i], [1, i], [2, i]]);
    }
    lines.push([[0, 0], [1, 1], [2, 2]]);
    lines.push([[0, 2], [1, 1], [2, 0]]);

    for (const line of lines) {
      const values = line.map((cell) => board[cell[0]][cell[1]]);
      if (values[0] && values.every((value) => value === values[0])) {
        return values[0];
      }
    }

    return board.flat().every(Boolean) ? "draw" : null;
  }

  function nextPlayer() {
    if (state.game === "chess") {
      state.currentPlayer = state.currentPlayer === "white" ? "black" : "white";
    } else if (state.game === "checkers") {
      state.currentPlayer = state.currentPlayer === "red" ? "black" : "red";
    } else {
      state.currentPlayer = state.currentPlayer === "x" ? "o" : "x";
    }
  }

  function listAllMoves(color, board) {
    const moves = [];
    const activeBoard = board || state.board;
    const size = state.game === "tictactoe" ? 3 : 8;

    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        const piece = activeBoard[row][col];
        if (state.game === "tictactoe") {
          if (!piece) moves.push({ from: null, to: { row: row, col: col } });
        } else if (piece && getModeColor(piece) === color) {
          const legalMoves = getLegalMoves(row, col, activeBoard, color);
          for (const move of legalMoves) {
            moves.push({ from: { row: row, col: col }, to: move });
          }
        }
      }
    }

    return moves;
  }

  function evaluateChessBoard(board) {
    let score = 0;
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const piece = board[row][col];
        if (!piece) continue;
        const value = chessPieceValues[piece.type] || 0;
        score += piece.color === "black" ? value : -value;
      }
    }
    return score;
  }

  function evaluateCheckersBoard(board) {
    let score = 0;
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const piece = board[row][col];
        if (!piece) continue;
        let value = piece.king ? 160 : 100;
        value += piece.color === "black" ? row * 4 : (7 - row) * 4;
        score += piece.color === "black" ? value : -value;
      }
    }
    return score;
  }

  function applyMoveToBoard(board, move, gameType, currentPlayer) {
    const nextBoard = cloneBoard(board);

    if (gameType === "tictactoe") {
      nextBoard[move.to.row][move.to.col] = currentPlayer;
      return nextBoard;
    }

    const piece = nextBoard[move.from.row][move.from.col];
    nextBoard[move.from.row][move.from.col] = null;

    if (gameType === "checkers" && move.to.jumped) {
      nextBoard[move.to.jumped.row][move.to.jumped.col] = null;
    }

    nextBoard[move.to.row][move.to.col] = piece;

    if (gameType === "checkers") {
      if (piece.color === "red" && move.to.row === 0) piece.king = true;
      if (piece.color === "black" && move.to.row === 7) piece.king = true;
    }

    if (gameType === "chess" && piece.type === "pawn" && (move.to.row === 0 || move.to.row === 7)) {
      piece.type = "queen";
    }

    return nextBoard;
  }

  function minimaxTicTacToe(board, turn, depth) {
    const winner = evaluateTicTacToe(board);
    if (winner === "o") return { score: 10 - depth };
    if (winner === "x") return { score: depth - 10 };
    if (winner === "draw") return { score: 0 };

    const moves = [];
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        if (!board[row][col]) {
          const nextBoard = cloneBoard(board);
          nextBoard[row][col] = turn;
          const result = minimaxTicTacToe(nextBoard, turn === "o" ? "x" : "o", depth + 1);
          moves.push({ move: { from: null, to: { row: row, col: col } }, score: result.score });
        }
      }
    }

    if (turn === "o") {
      return moves.reduce((best, move) => move.score > best.score ? move : best);
    }
    return moves.reduce((best, move) => move.score < best.score ? move : best);
  }

  function chooseBestSearchMove(moves, evaluateBoard, nextColor) {
    let bestMove = null;
    let bestScore = -Infinity;

    for (const move of moves) {
      const nextBoard = applyMoveToBoard(state.board, move, state.game, state.currentPlayer);
      let score = evaluateBoard(nextBoard);

      if (state.game === "chess") {
        const enemyMoves = listAllMoves(nextColor, nextBoard);
        if (!enemyMoves.length) {
          score += isKingInCheck(nextBoard, nextColor) ? 50000 : 0;
        }
      }

      if (state.game === "checkers") {
        const enemyMoves = listAllMoves(nextColor, nextBoard);
        if (!enemyMoves.length) {
          score += 10000;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  function pickComputerMove() {
    if (state.game === "tictactoe") {
      const moves = listAllMoves("o");
      if (!moves.length) return null;

      if (state.difficulty === "easy") {
        return moves[Math.floor(Math.random() * moves.length)];
      }

      if (state.difficulty === "medium") {
        for (const move of moves) {
          const board = cloneBoard(state.board);
          board[move.to.row][move.to.col] = "o";
          if (evaluateTicTacToe(board) === "o") return move;
        }
        for (const move of moves) {
          const board = cloneBoard(state.board);
          board[move.to.row][move.to.col] = "x";
          if (evaluateTicTacToe(board) === "x") return move;
        }
        if (!state.board[1][1]) return { from: null, to: { row: 1, col: 1 } };
        return moves[Math.floor(Math.random() * moves.length)];
      }

      return minimaxTicTacToe(cloneBoard(state.board), "o", 0).move;
    }

    const moves = listAllMoves(state.currentPlayer);
    if (!moves.length) return null;

    if (state.difficulty === "easy") {
      return moves[Math.floor(Math.random() * moves.length)];
    }

    if (state.game === "checkers") {
      const captures = moves.filter((move) => move.to.capture);
      if (state.difficulty === "medium") {
        const pool = captures.length ? captures : moves;
        return pool[0];
      }
      return chooseBestSearchMove(captures.length ? captures : moves, evaluateCheckersBoard, "red");
    }

    if (state.game === "chess") {
      if (state.difficulty === "medium") {
        const captures = moves.filter((move) => move.to.capture);
        if (captures.length) return captures[0];
        const checkingMove = moves.find((move) => {
          const nextBoard = applyMoveToBoard(state.board, move, "chess", state.currentPlayer);
          return isKingInCheck(nextBoard, "white");
        });
        return checkingMove || moves[0];
      }
      return chooseBestSearchMove(moves, evaluateChessBoard, "white");
    }

    return moves[0];
  }

  function resolveEndState() {
    if (state.game === "tictactoe") {
      state.winner = evaluateTicTacToe(state.board);
      if (state.winner === "draw") {
        state.endReason = "three matched neither side";
      }
      return;
    }

    const availableMoves = listAllMoves(state.currentPlayer);

    if (state.game === "chess") {
      if (!availableMoves.length) {
        if (isKingInCheck(state.board, state.currentPlayer)) {
          state.winner = opponentOf(state.currentPlayer);
          state.endReason = "checkmate";
        } else {
          state.winner = "draw";
          state.endReason = "stalemate";
        }
      }
      return;
    }

    if (state.game === "checkers") {
      let redCount = 0;
      let blackCount = 0;
      for (let row = 0; row < 8; row += 1) {
        for (let col = 0; col < 8; col += 1) {
          const piece = state.board[row][col];
          if (!piece) continue;
          if (piece.color === "red") redCount += 1;
          if (piece.color === "black") blackCount += 1;
        }
      }
      if (!redCount) {
        state.winner = "black";
        state.endReason = "clear";
      } else if (!blackCount) {
        state.winner = "red";
        state.endReason = "clear";
      } else if (!availableMoves.length) {
        state.winner = opponentOf(state.currentPlayer);
        state.endReason = "no moves";
      }
    }
  }

  function applyMove(move) {
    if (state.game === "tictactoe") {
      state.board[move.to.row][move.to.col] = state.currentPlayer;
      state.selected = null;
      state.legalMoves = [];
      resolveEndState();
      if (!state.winner) {
        nextPlayer();
        resolveEndState();
      }
      updateStatus();
      renderBoard();
      maybeComputerTurn();
      return;
    }

    state.board = applyMoveToBoard(state.board, move, state.game, state.currentPlayer);
    state.selected = null;
    state.legalMoves = [];
    nextPlayer();
    resolveEndState();
    updateStatus();
    renderBoard();
    maybeComputerTurn();
  }

  function selectCell(row, col) {
    if (state.paused || state.winner || state.waitingForComputer) return;

    if (state.game === "tictactoe") {
      const legal = getLegalMoves(row, col);
      if (legal.length) {
        applyMove({ from: null, to: legal[0] });
      }
      return;
    }

    const piece = state.board[row][col];
    const owner = getModeColor(piece);

    if (state.selected) {
      const freshMoves = getLegalMoves(state.selected.row, state.selected.col);
      const targetMove = freshMoves.find((move) => move.row === row && move.col === col);
      if (targetMove) {
        state.legalMoves = freshMoves;
        applyMove({ from: state.selected, to: targetMove });
        return;
      }
    }

    if (!piece || owner !== state.currentPlayer) {
      state.selected = null;
      state.legalMoves = [];
      renderBoard();
      return;
    }

    state.selected = { row: row, col: col };
    state.legalMoves = getLegalMoves(row, col);
    if (!state.legalMoves.length && state.game === "chess") {
      updateStatus("That piece has no legal move right now.");
    }
    renderBoard();
  }

  function maybeComputerTurn() {
    if (!isComputerTurn()) return;
    state.waitingForComputer = true;
    updateStatus("Computer thinking...");
    window.setTimeout(() => {
      if (!isComputerTurn()) {
        state.waitingForComputer = false;
        updateStatus();
        renderBoard();
        return;
      }

      const move = pickComputerMove();
      state.waitingForComputer = false;
      if (move) {
        applyMove(move);
      } else {
        resolveEndState();
        updateStatus();
        renderBoard();
      }
    }, state.difficulty === "hard" ? 420 : 240);
  }

  function createPieceElement(piece) {
    const pieceElement = document.createElement("span");
    pieceElement.className = "board-piece";

    if (state.game === "chess") {
      pieceElement.classList.add(piece.color === "white" ? "board-piece--chess-white" : "board-piece--chess-black");
      pieceElement.textContent = chessIcons[piece.color][piece.type];
      return pieceElement;
    }

    if (state.game === "checkers") {
      pieceElement.className = "board-piece board-piece--checker " +
        (piece.color === "red" ? "board-piece--red" : "board-piece--black") +
        (piece.king ? " board-piece--king" : "");
      return pieceElement;
    }

    pieceElement.textContent = piece.toUpperCase();
    return pieceElement;
  }

  function renderBoard() {
    const size = state.game === "tictactoe" ? 3 : 8;
    boardElement.innerHTML = "";
    boardElement.dataset.size = String(size);

    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        const button = document.createElement("button");
        const isPlain = state.game === "tictactoe";
        button.type = "button";
        button.className = "board-cell " + (isPlain
          ? "board-cell--plain"
          : ((row + col) % 2 === 0 ? "board-cell--light" : "board-cell--dark"));

        if (state.selected && state.selected.row === row && state.selected.col === col) {
          button.classList.add("is-selected");
        }

        const legalMove = state.legalMoves.find((move) => move.row === row && move.col === col);
        if (legalMove) {
          button.classList.add(legalMove.capture ? "is-capture" : "is-legal");
        }

        button.addEventListener("click", function () {
          selectCell(row, col);
        });

        const piece = state.board[row][col];
        if (piece) {
          button.appendChild(createPieceElement(piece));
        }

        boardElement.appendChild(button);
      }
    }

    overlayElement.hidden = !state.paused;
  }

  function setGame(nextGame) {
    state.game = nextGame;
    document.querySelectorAll("[data-game]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.game === nextGame);
    });
    resetGame();
  }

  function setMode(nextMode) {
    state.mode = nextMode;
    document.querySelectorAll("[data-mode]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.mode === nextMode);
    });
    resetGame();
  }

  function setDifficulty(nextDifficulty) {
    state.difficulty = nextDifficulty;
    document.querySelectorAll("[data-difficulty]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.difficulty === nextDifficulty);
    });
    updateStatus();
  }

  document.querySelectorAll("[data-game]").forEach((button) => {
    button.addEventListener("click", function () {
      setGame(button.dataset.game);
    });
  });

  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", function () {
      setMode(button.dataset.mode);
    });
  });

  document.querySelectorAll("[data-difficulty]").forEach((button) => {
    button.addEventListener("click", function () {
      setDifficulty(button.dataset.difficulty);
    });
  });

  restartButton.addEventListener("click", resetGame);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      returnToMenu();
      return;
    }

    if (event.key.toLowerCase() === "p") {
      state.paused = !state.paused;
      renderBoard();
    }
  });

  resetGame();
}());
