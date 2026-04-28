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
  gridSize: number;
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
  const [showReview, setShowReview] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const { grid, gridSize, clues } = data;

  // Initialize user grid
  useEffect(() => {
    const initialGrid = grid.map(row => row.map(cell => (cell === null ? '#' : '')));
    setUserGrid(initialGrid);

    // Find first playable cell
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (grid[r][c] !== null) {
          setCursor({ row: r, col: c });
          return;
        }
      }
    }
  }, [data]);

  // Check if complete
  useEffect(() => {
    if (userGrid.length === 0) return;

    let complete = true;
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (grid[r][c] !== null && userGrid[r][c] !== grid[r][c]) {
          complete = false;
          break;
        }
      }
    }
    if (complete) setFinished(true);
  }, [userGrid]);

  const handleCellClick = (r: number, c: number) => {
    if (grid[r][c] === null) return;
    if (cursor.row === r && cursor.col === c) {
      setDirection(prev => (prev === 'across' ? 'down' : 'across'));
    } else {
      setCursor({ row: r, col: c });
    }
  };

  const moveCursor = (dr: number, dc: number) => {
    let nr = cursor.row + dr;
    let nc = cursor.col + dc;

    if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize && grid[nr][nc] !== null) {
      setCursor({ row: nr, col: nc });
    }
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
        if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize && grid[nr][nc] !== null) {
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

    if (/^[a-zA-Z]$/.test(e.key)) {
      const char = e.key.toUpperCase();
      const newGrid = [...userGrid];
      newGrid[cursor.row][cursor.col] = char;
      setUserGrid(newGrid);

      // Auto advance
      const dr = direction === 'down' ? 1 : 0;
      const dc = direction === 'across' ? 1 : 0;
      let nr = cursor.row + dr;
      let nc = cursor.col + dc;
      if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize && grid[nr][nc] !== null) {
        setCursor({ row: nr, col: nc });
      }
    }
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
      <h1 className="brand-name" style={{ marginBottom: '20px' }}>{title}</h1>

      <div ref={sheetRef} className="crossword-layout" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}>

        {/* Grid Container */}
        <div
          className="xword-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gap: '2px',
            backgroundColor: '#333',
            border: '4px solid #333',
            width: '100%',
            maxWidth: '400px',
            aspectRatio: '1/1'
          }}
        >
          {userGrid.map((row, r) => row.map((cell, c) => {
            const isBlack = cell === '#';
            const isSelected = cursor.row === r && cursor.col === c;
            const inWord = isCellInCurrentWord(r, c) && !isBlack;
            const number = getCellNumber(r, c);

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                style={{
                  position: 'relative',
                  backgroundColor: isBlack ? '#1a1a1a' : (isSelected ? '#ff008a' : (inWord ? '#ffd1e3' : 'white')),
                  color: isSelected ? 'white' : 'black',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: '1.4rem',
                  fontWeight: 'bold',
                  cursor: isBlack ? 'default' : 'pointer',
                  userSelect: 'none',
                  width: '100%',
                  height: '100%',
                  boxSizing: 'border-box',
                  overflow: 'hidden'
                }}
              >
                {number && (
                  <span style={{
                    position: 'absolute',
                    top: '2px',
                    left: '2px',
                    fontSize: '0.6rem',
                    color: isSelected ? 'white' : '#666'
                  }}>
                    {number}
                  </span>
                )}
                {!isBlack && cell}
              </div>
            );
          }))}
        </div>

        {/* Clue Section */}
        <div className="clue-display" style={{ textAlign: 'center', minHeight: '60px', padding: '15px', backgroundColor: '#fdf2f8', borderRadius: '12px', width: '100%', maxWidth: '400px' }}>
          <h4 style={{ margin: '0 0 5px 0', color: '#ff008a', textTransform: 'uppercase', fontSize: '0.8rem' }}>
            {direction}
          </h4>
          <h4 style={{ margin: 0, fontWeight: '600' }}>
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
              return currentClue ? `${currentClue.text} [${currentClue.answer.length}]` : "Select a cell to see clue";
            })()}
          </h4>
        </div>

        {finished && (
          <div className="victory-overlay" style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <h2 style={{ color: '#ff008a' }}>Perfect! 🥳</h2>
            
            <div className="capture-branding">
              <img src={`/logo.png`} alt="Logo" style={{ width: '50px', height: '50px' }} />
              <h2 className="brand-result">PINKLUNGI GAMES</h2>
              <h5 className="capture-link">pinklungigames.com</h5>
            </div>

            <div className="no-capture" style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={handleShareImage}>Share Result</button>
              <button onClick={() => window.location.reload()}>Play Again</button>
            </div>
          </div>
        )}
      </div>

      {/* Clue Lists (Side by Side) */}
      <div className="clue-lists" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '40px', textAlign: 'left' }}>
        <div>
          <h3 style={{ borderBottom: '2px solid #ff008a', paddingBottom: '5px' }}>ACROSS</h3>
          {clues.across.map(cl => (
            <div
              key={`ac-${cl.number}`}
              onClick={() => { setCursor({ row: cl.row, col: cl.col }); setDirection('across'); }}
              style={{ padding: '8px 0', cursor: 'pointer', borderBottom: '1px solid #eee', opacity: (direction === 'across' && cursor.row === cl.row) ? 1 : 0.7 }}
            >
              <strong>{cl.number}.</strong> {cl.text}
            </div>
          ))}
        </div>
        <div>
          <h3 style={{ borderBottom: '2px solid #ff008a', paddingBottom: '5px' }}>DOWN</h3>
          {clues.down.map(cl => (
            <div
              key={`dn-${cl.number}`}
              onClick={() => { setCursor({ row: cl.row, col: cl.col }); setDirection('down'); }}
              style={{ padding: '8px 0', cursor: 'pointer', borderBottom: '1px solid #eee', opacity: (direction === 'down' && cursor.col === cl.col) ? 1 : 0.7 }}
            >
              <strong>{cl.number}.</strong> {cl.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
