import { useState } from 'react';

const DIFFICULTY_COLORS = ['#fbd334', '#a1c436', '#6ebcd2', '#ba81c5'];

export const Connections = ({ data, title }: { data: any; title: string }) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [solvedGroups, setSolvedGroups] = useState<any[]>([]);
  const [shake, setShake] = useState(false);
  const [submitAnim, setSubmitAnim] = useState(false);
  const [lives, setLives] = useState(4);

  // Initialize and manage active tiles
  const [gridItems, setGridItems] = useState(() => 
    data.groups.flatMap((g: any) => g.items).sort(() => Math.random() - 0.5)
  );

  const isGameOver = lives === 0 || solvedGroups.length === 4;

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
    const selectedGroup = data.groups.find((g: any) => 
      selected.every(s => g.items.includes(s))
    );

    if (selectedGroup) {
      setSubmitAnim(true);
      setTimeout(() => {
        setSolvedGroups([...solvedGroups, { 
            ...selectedGroup, 
            color: DIFFICULTY_COLORS[selectedGroup.difficulty] 
        }]);
        setGridItems(gridItems.filter(item => !selected.includes(item)));
        setSelected([]);
        setSubmitAnim(false);
      }, 500);
    } else {
      setLives(l => l - 1);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setSelected([]);
    }
  };

  if (isGameOver) {
    return (
      <div className="container" style={{ textAlign: 'center' }}>
        <h1>{solvedGroups.length === 4 ? "You Won!" : "Game Over"}</h1>
        <button onClick={() => window.location.reload()}>PLAY AGAIN</button>
      </div>
    );
  }

  return (
    <div className='container'>
      <h1>{title}</h1>
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

        <div className={`conn-grid ${submitAnim ? 'submit-anim' : ''}`}>
          {gridItems.map((item) => (
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