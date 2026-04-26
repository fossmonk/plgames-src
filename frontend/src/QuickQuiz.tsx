import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';

const getGameOverMeme = (score: number, total: number) => {
  const ratio = score / total;

  // Perfect Score
  if (ratio === 1) {
    const perfectMemes = [
      "vikrammeme.jpg",
      "vakeelmeme.jpg"
    ];
    return perfectMemes[Math.floor(Math.random() * perfectMemes.length)];
  }

  // Good Score (> 70%)
  if (ratio >= 0.7) {
    const goodMemes = [
      "nirulsahameme.jpg",
      "answermeme.jpg",
      "edamonememe.jpg",
      "chandumeme.jpg",
      "pulimeme.jpg"
    ];
    return goodMemes[Math.floor(Math.random() * goodMemes.length)];
  }

  // Needs Improvement
  const badMemes = [
    "sensememe.jpg",
    "pattumalsarammeme.jpg",
    "trappedmeme.jpg",
    "pavanayimeme.jpg"
  ];
  return badMemes[Math.floor(Math.random() * badMemes.length)];
};

export function QuickQuizComponent({ data, title }: { data: any; title: string }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const handleShareImage = async () => {
    const element = sheetRef.current;
    if (!element) return;

    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const bgColor = isDarkMode ? '#121212' : '#ffffff';

    // Capture the element
    element.classList.add('is-capturing');
    const canvas = await html2canvas(element, {
      backgroundColor: bgColor,
      scale: 2
    });
    element.classList.remove('is-capturing');

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'quiz-result.png', { type: 'image/png' });

      // Native Share API
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My Quick Quiz Score',
          text: 'Check out my score on PinkLungi Games! Play at https://pinklungigames.com'
        });
      } else {
        // Fallback for desktop/browsers without Share API
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'pinklungi-result.png';
        link.click();
      }
    });
  };
  
  // New state to track the radio selection
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const handleSubmit = () => {
    if (selectedOption === null) return; // Don't allow submission without selection

    // Check if correct
    if (selectedOption === data.questions[currentIdx].correct_idx) {
      setScore(score + 1);
    }

    // Move to next
    if (currentIdx + 1 < data.questions.length) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOption(null); // Reset for next question
    } else {
      setFinished(true);
    }
  };

  if (finished) {
    const isPerfect = score === data.questions.length;
    const meme = getGameOverMeme(score, data.questions.length);
    const memeSrc = `/memes/${meme}`;
    const logoSrc = `/logo.png`;

    return (
      <div className="container">
        <div className="game-over-sheet" ref={sheetRef}>
          <img src={memeSrc} alt="Result Meme" className="game-over-meme" />
          {isPerfect && (
            <div className="party-popper-animation">🥳</div>
          )}
          <h3>Your Final Score:</h3>
          <div className="score-text">{score} / {data.questions.length}</div>

          <div className="capture-branding">
            <img 
              src={logoSrc}
              alt="PinkLungi Logo" 
              style={{ width: '50px', height: '50px' }} 
            />
            <h2 className="brand-result">PINKLUNGI GAMES</h2>
            <h5 className="capture-link">pinklungigames.com</h5>
          </div>

          <div className="no-capture" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={handleShareImage}>SHARE RESULT</button>
            <button onClick={() => window.location.reload()}>PLAY AGAIN</button>
          </div>
        </div>
      </div>
    );
  }

  const q = data.questions[currentIdx];

  return (
    <div className="container">
      <h1 className="brand-name">{title}</h1>
      <div className="game-card">
        <h3>{q.text}</h3>
        
        {/* Radio Button Group */}
        <div className="radio-group">
          {q.options.map((opt: string, i: number) => (
            <label key={i} className="radio-option">
              <input
                type="radio"
                name="quiz-option"
                value={i}
                checked={selectedOption === i}
                onChange={() => setSelectedOption(i)}
              />
              {opt}
            </label>
          ))}
        </div>

        <button 
          className="submit-btn" 
          disabled={selectedOption === null} 
          onClick={handleSubmit}
        >
          Submit Answer
        </button>
      </div>
    </div>
  );
}