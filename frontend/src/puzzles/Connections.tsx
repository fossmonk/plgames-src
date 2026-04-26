import { useState } from 'react';

const DIFFICULTY_COLORS = ['#fbd334', '#a1c436', '#6ebcd2', '#ba81c5'];
const DIFF_COLOR_MAP = ['🟨', '🟩', '🟦', '🟪'];

export const Connections = ({ data, title }: { data: any; title: string }) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [solvedGroups, setSolvedGroups] = useState<any[]>([]);
  const [shake, setShake] = useState(false);
  const [submitAnim, setSubmitAnim] = useState(false);
  const [lives, setLives] = useState(4);
  const [guessHistory, setGuessHistory] = useState<string[][]>([]);

  // Initialize and manage active tiles
  const [gridItems, setGridItems] = useState(() => 
    data.groups.flatMap((g: any) => g.items).sort(() => Math.random() - 0.5)
  );

  const [showResults, setShowResults] = useState(false); // Add this

  const toggleSelect = (item: string) => {
    if (selected.includes(item)) {
      setSelected(selected.filter(i => i !== item));
    } else if (selected.length < 4) {
      setSelected([...selected, item]);
    }
  };

  const handleShuffle = () => {
    setGridItems([...gridItems].sort(() => Math.random() - 0.5));
  };

  const handleDeselect = () => setSelected([]);

  const checkSelection = () => {
    // 1. Create the guess history row based on current selection
    // Mapping each selected item to its difficulty color code
    const currentGuess = selected.map(item => {
      const group = data.groups.find((g: any) => g.items.includes(item));
      return DIFF_COLOR_MAP[group.difficulty]; 
    });

    // 2. Add this guess to your history state
    setGuessHistory(prev => [...prev, currentGuess]);

    const selectedGroup = data.groups.find((g: any) => 
      selected.every(s => g.items.includes(s))
    );

    if (selectedGroup) {
      setSubmitAnim(true);
      setTimeout(() => {
        const newSolvedGroups = [...solvedGroups, { 
            ...selectedGroup, 
            color: DIFFICULTY_COLORS[selectedGroup.difficulty] 
        }];
        setSolvedGroups(newSolvedGroups);
        setGridItems(gridItems.filter((item: any) => !selected.includes(item)));
        setSelected([]);
        setSubmitAnim(false);

        // If this was the last group, DON'T show results yet, just let them see the grid
      }, 500);
    }
  };

  const getEmojiGrid = (history: string[][]) => {
    return history.map(row => row.join('')).join('\n');
  };

  const handleShare = (title: string) => {
    const shareText = `PINKLUNGI GAMES\nPuzzles\n${title}\n${getEmojiGrid(guessHistory)}\n\nPlay at: pinklungigames.com`;
    if (navigator.share) {
      navigator.share({ text: shareText });
    } else {
      navigator.clipboard.writeText(shareText);
      alert("Result copied to clipboard!");
    }
  };

  // Determine if we are in a final state
  const isLost = lives === 0;
  const isWon = solvedGroups.length === 4;

  if (showResults || isLost) {
    return (
      <div className="container" style={{ textAlign: 'center' }}>
        <h1>{isWon ? "You Won!" : "Game Over"}</h1>

        {guessHistory.length > 0 && (
          <div style={{ margin: '20px 0', fontSize: '1.5rem', whiteSpace: 'pre-line', lineHeight: '1.2' }}>
            {getEmojiGrid(guessHistory)}
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={() => window.location.reload()}>PLAY AGAIN</button>
          {isWon && (
            <button onClick={() => handleShare(title)}>SHARE RESULT</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className='container'>
      <h2>{title}</h2>
      <div className="lives-display">LIVES: {'❤️'.repeat(lives)}</div>
      
      <div className={`conn-container ${shake ? 'shake' : ''}`}>
        <div className="solved-area">
          {solvedGroups.map((g, i) => (
            <div key={i} className="solved-group" style={{ backgroundColor: g.color }}>
              <strong style={{ display: 'block', marginBottom: '5px' }}>{g.category}</strong>
              <span style={{ fontSize: '0.9rem', color: '#333' }}>{g.items.join(', ')}</span>
            </div>
          ))}
        </div>

        {/* Victory Lap Button appears only when the 4th group is solved */}
        {isWon && (
          <div style={{ textAlign: 'center', margin: '15px 0' }}>
            <button onClick={() => setShowResults(true)} style={{ padding: '10px 20px', fontSize: '1rem' }}>
              SEE FINAL RESULTS
            </button>
          </div>
        )}

        <div className={`conn-grid ${submitAnim ? 'submit-anim' : ''}`}>
          {gridItems.map((item: any) => (
            <button 
              key={item}
              className={`tile ${selected.includes(item) ? 'active' : ''}`}
              onClick={() => toggleSelect(item)}
            >
              {item}
            </button>
          ))}
        </div>
        
        <div className="controls">
          <button onClick={handleShuffle}>SHUFFLE</button>
          <button onClick={handleDeselect} disabled={selected.length === 0}>DESELECT</button>
          <button onClick={checkSelection} disabled={selected.length < 4}>SUBMIT</button>
        </div>
      </div>
    </div>
  );
};