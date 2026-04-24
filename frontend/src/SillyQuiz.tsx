import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const getGameOverText = (score: number, total: number) => {
  const ratio = score / total;

  // Perfect Score
  if (ratio === 1) {
    const perfectMessages = [
      "🎉 VIKRAMETTA, YOU'RE GREAT!",
      "🤯 KANAN VALIYA LOOK ILLENNE ULLU, BHAYANKARA BUDHIYA!",
      "🔥 YEVAN PULIYAAN KETTA!",
      "🏆 CHANDUVINE THOLPIKKAN AAVILLA MAKKALE!"
    ];
    return perfectMessages[Math.floor(Math.random() * perfectMessages.length)];
  }

  // Good Score (> 70%)
  if (ratio >= 0.7) {
    const goodMessages = [
      "KOLLAAM...NINNE NJAN NIRULSAHAPEDUTHUNNILLA...",
      "I AM THE ANSWER!",
      "ALLELUM ELLA KAZHIVUM ORALK KITTILLALLO..",
      "EDA MONEEYY!!"
    ];
    return goodMessages[Math.floor(Math.random() * goodMessages.length)];
  }

  // Needs Improvement
  const badMessages = [
    "PATTULLEL KALANJITT PODEY..",
    "INIYIPPO KAAVILE PATTUMALSARATHINU NOKKAM..",
    "SENSE UNDAVANAM...SENSIBILITY UNDAVANAM...",
    "ANGANE PAVANAYI SHAVAMAYI..."
  ];
  return badMessages[Math.floor(Math.random() * badMessages.length)];
};

export function SillyQuizComponent({ data, title }: { data: any; title: string }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const navigate = useNavigate();
  
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
    const headerText = getGameOverText(score, data.questions.length);

    return (
      <div className="container">
        {/* Hand-drawn style wrapper */}
        <div className="game-over-sheet">
          <h2>{headerText}</h2>
          
          {isPerfect && (
            <div className="party-popper-animation">🥳</div>
          )}

          <h3>Your Final Score:</h3>
          <div className="score-text">
            {score} / {data.questions.length}
          </div>
          
          <button onClick={() => navigate('/')}>PLAY AGAIN</button>
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