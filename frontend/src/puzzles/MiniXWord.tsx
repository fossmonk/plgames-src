import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';

interface Clue {
  number: number;
  row: number;
  col: number;
  text: string;
  answer: string;
}

interface CrosswordData {
  gridSize: number | [number, number]; // [width, height] or single number for square
  grid: (string | null)[][]; // null for black squares
  clues: {
    across: Clue[];
    down: Clue[];
  };
}

export function MiniXWord({ data, title }: { data: CrosswordData; title: string }) {
  const [userGrid, setUserGrid] = useState<string[][]>([]);
  const [cursor, setCursor] = useState({ row: 0, col: 0 });
  const [direction, setDirection] = useState<'across' | 'down'>('across');
  const [finished, setFinished] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [checkedCells, setCheckedCells] = useState<Record<string, 'correct' | 'incorrect' | null>>({});

  const { grid, gridSize, clues } = data;
  const cols = Array.isArray(gridSize) ? gridSize[0] : gridSize;
  const rows = Array.isArray(gridSize) ? gridSize[1] : gridSize;

  // Initialize user grid
  useEffect(() => {
    const initialGrid = grid.map(row => row.map(cell => (cell === null ? '#' : '')));
    setUserGrid(initialGrid);

    // Find first playable cell
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] !== null) {
          setCursor({ row: r, col: c });
          return;
        }
      }
    }
  }, [data, rows, cols]);

  // Check if complete
  useEffect(() => {
    if (userGrid.length === 0) return;

    let complete = true;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] !== null && userGrid[r][c] !== grid[r][c]) {
          complete = false;
          break;
        }
      }
    }
    if (complete) setFinished(true);
  }, [userGrid, rows, cols]);

  const handleCellClick = (r: number, c: number) => {
    if (grid[r][c] === null) return;
    if (cursor.row === r && cursor.col === c) {
      setDirection(prev => (prev === 'across' ? 'down' : 'across'));
    } else {
      setCursor({ row: r, col: c });
    }
    // Trigger mobile keyboard
    inputRef.current?.focus();
  };

  const moveCursor = (dr: number, dc: number) => {
    let nr = cursor.row + dr;
    let nc = cursor.col + dc;

    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] !== null) {
      setCursor({ row: nr, col: nc });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;

    const char = val.slice(-1).toUpperCase();
    if (/^[A-Z]$/.test(char)) {
      applyChar(char);
    }
    // Clear for next input
    if (inputRef.current) inputRef.current.value = "";
  };

  const applyChar = (char: string) => {
    const newGrid = [...userGrid];
    newGrid[cursor.row][cursor.col] = char;
    setUserGrid(newGrid);

    // Auto advance
    const dr = direction === 'down' ? 1 : 0;
    const dc = direction === 'across' ? 1 : 0;
    let nr = cursor.row + dr;
    let nc = cursor.col + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] !== null) {
      setCursor({ row: nr, col: nc });
    }
  };

  const handleCheck = () => {
    const status: Record<string, 'correct' | 'incorrect' | null> = {};
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = userGrid[r][c];
        if (cell && cell !== '#') {
          status[`${r}-${c}`] = (cell === grid[r][c]) ? 'correct' : 'incorrect';
        }
      }
    }
    setCheckedCells(status);
    // Clear after 2 seconds
    setTimeout(() => setCheckedCells({}), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (finished) return;

    if (e.key === 'Backspace') {
      const newGrid = [...userGrid];
      if (newGrid[cursor.row][cursor.col] === '') {
        // Move back first
        const dr = direction === 'down' ? -1 : 0;
        const dc = direction === 'across' ? -1 : 0;
        let nr = cursor.row + dr;
        let nc = cursor.col + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] !== null) {
          newGrid[nr][nc] = '';
          setCursor({ row: nr, col: nc });
        }
      } else {
        newGrid[cursor.row][cursor.col] = '';
      }
      setUserGrid(newGrid);
      return;
    }

    if (e.key === 'ArrowUp') moveCursor(-1, 0);
    if (e.key === 'ArrowDown') moveCursor(1, 0);
    if (e.key === 'ArrowLeft') moveCursor(0, -1);
    if (e.key === 'ArrowRight') moveCursor(0, 1);
    if (e.key === ' ') setDirection(prev => (prev === 'across' ? 'down' : 'across'));
  };

  const getCellNumber = (r: number, c: number) => {
    const across = clues.across.find(cl => cl.row === r && cl.col === c);
    const down = clues.down.find(cl => cl.row === r && cl.col === c);
    return across?.number || down?.number || null;
  };

  const isCellInCurrentWord = (r: number, c: number) => {
    // Very simplified check: same row/col as cursor
    if (direction === 'across') return r === cursor.row;
    return c === cursor.col;
  };

  const handleShareImage = async () => {
    const element = sheetRef.current;
    if (!element) return;
    element.classList.add('is-capturing');
    const canvas = await html2canvas(element, { backgroundColor: '#ffffff', scale: 2 });
    element.classList.remove('is-capturing');

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'crossword-result.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'I solved the Mini Crossword!', text: 'PinkLungi Games!' });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'crossword-result.png';
        link.click();
      }
    });
  };

  if (userGrid.length === 0) return null;

  return (
    <div className="container" onKeyDown={handleKeyDown} tabIndex={0} style={{ outline: 'none' }}>
      {/* Hidden input to trigger mobile keyboard */}
      <input
        ref={inputRef}
        type="text"
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck="false"
        onChange={handleInputChange}
        className="hidden-input"
      />
      <h1 className="brand-name mb-20">{title}</h1>

      <div ref={sheetRef} className="crossword-layout">

        {/* Grid Container */}
        <div
          className="xword-grid"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
          }}
        >
          {userGrid.map((row, r) => row.map((cell, c) => {
            const isBlack = cell === '#';
            const isSelected = cursor.row === r && cursor.col === c;
            const inWord = isCellInCurrentWord(r, c) && !isBlack;
            const number = getCellNumber(r, c);
            const checkStatus = checkedCells[`${r}-${c}`];

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                className={`xword-cell ${isBlack ? 'black' : ''} ${isSelected ? 'selected' : ''} ${inWord ? 'in-word' : ''} ${checkStatus ? `pulse-${checkStatus}` : ''}`}
                style={{
                  boxShadow: checkStatus === 'correct' ? 'inset 0 0 10px #4caf50' : (checkStatus === 'incorrect' ? 'inset 0 0 10px #f44336' : 'none'),
                }}
              >
                {number && (
                  <span className={`cell-number ${isSelected ? 'selected' : ''}`}>
                    {number}
                  </span>
                )}
                {!isBlack && cell}
              </div>
            );
          }))}
        </div>

        {/* Clue Section */}
        <div className="clue-display-bar clue-display">
          <h4>{direction}</h4>
          <h4>
            {(() => {
              const number = getCellNumber(cursor.row, cursor.col);
              if (!number) return "Select a numbered cell to see clue";

              const currentClue = clues[direction].find(cl => {
                if (direction === 'across') {
                  return cl.row === cursor.row && cursor.col >= cl.col && cursor.col < cl.col + cl.answer.length;
                } else {
                  return cl.col === cursor.col && cursor.row >= cl.row && cursor.row < cl.row + cl.answer.length;
                }
              });
              return currentClue ? `${currentClue.number}. ${currentClue.text} [${currentClue.answer.length}]` : "Select a cell to see clue";
            })()}
          </h4>
        </div>

        {!finished && (
          <div className="no-capture mt-10 flex-center">
            <button onClick={handleCheck} style={{ backgroundColor: '#2196f3', fontSize: '0.8rem', padding: '8px 15px', width: 'auto' }}>
              CHECK ANSWERS
            </button>
          </div>
        )}

        {finished && (
          <div className="victory-overlay">
            <h2>Perfect! 🥳</h2>

            <div className="capture-branding flex-col flex-center">
              <img src={`/logo.png`} alt="Logo" className="brand-logo-ui" />
              <h2 className="brand-result">PINKLUNGI GAMES</h2>
              <h5 className="capture-link">pinklungigames.com</h5>
            </div>

            <div className="no-capture flex-center gap-10">
              <button onClick={handleShareImage}>Share Result</button>
              <button onClick={() => window.location.reload()}>Play Again</button>
            </div>
          </div>
        )}
      </div>

      {/* Clue Lists (Side by Side) */}
      <div className="clue-lists-grid">
        <div className="clue-list-section">
          <h3>ACROSS</h3>
          {clues.across.map(cl => (
            <div
              key={`ac-${cl.number}`}
              onClick={() => { setCursor({ row: cl.row, col: cl.col }); setDirection('across'); }}
              className="clue-item-row"
              style={{ opacity: (direction === 'across' && cursor.row === cl.row) ? 1 : 0.7 }}
            >
              <strong>{cl.number}.</strong> {cl.text} [{cl.answer.length}]
            </div>
          ))}
        </div>
        <div className="clue-list-section">
          <h3>DOWN</h3>
          {clues.down.map(cl => (
            <div
              key={`dn-${cl.number}`}
              onClick={() => { setCursor({ row: cl.row, col: cl.col }); setDirection('down'); }}
              className="clue-item-row"
              style={{ opacity: (direction === 'down' && cursor.col === cl.col) ? 1 : 0.7 }}
            >
              <strong>{cl.number}.</strong> {cl.text} [{cl.answer.length}]
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
