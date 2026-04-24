import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

  if (finished) return (
    <div className="container">
      <div className="game-card">
        <h1>Game Over!</h1>
        <p>Your Final Score: {score} / {data.questions.length}</p>
        <button onClick={() => navigate('/')}>PLAY AGAIN</button>
      </div>
    </div>
  );

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