import { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';

import { getGameOverMeme } from '../utils/memeUtils';

export function Mcq({ data, title }: { data: any; title: string }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<any[]>([]);
  const [showReview, setShowReview] = useState(false);
  // Store the meme once when the game finishes so it doesn't reload
  const [meme, setMeme] = useState<string>("");
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (finished) {
      setMeme(getGameOverMeme(score, data.questions.length));
    }
  }, [finished]);

  const handleShareImage = async () => {
    const element = sheetRef.current;
    if (!element) return;
    element.classList.add('is-capturing');
    const canvas = await html2canvas(element, { backgroundColor: '#ffffff', scale: 2 });
    element.classList.remove('is-capturing');

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'quiz-result.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My Score', text: 'PinkLungi Games!' });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'quiz-result.png';
        link.click();
      }
    });
  };

  const handleSubmit = () => {
    if (selectedOption === null) return;
    const q = data.questions[currentIdx];
    const isCorrect = selectedOption === q.correct_idx;
    if (isCorrect) setScore(score + 1);

    setUserAnswers([...userAnswers, { ...q, userChoice: selectedOption, isCorrect }]);

    if (currentIdx + 1 < data.questions.length) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOption(null);
    } else {
      setFinished(true);
    }
  };

  if (finished) {
    const isPerfect = score === data.questions.length;
    return (
      <div className="container">
        <div className="game-over-sheet" ref={sheetRef}>
          <img src={`/memes/${meme}`} alt="Result Meme" className="game-over-meme" />
          {isPerfect && <div className="party-popper-animation">🥳</div>}

          <h3>Your Final Score:</h3>
          <div className="score-text">{score} / {data.questions.length}</div>

          {showReview ? (
            <div className="text-left">
              {userAnswers.map((q, idx) => (
                <div key={idx} className="game-card mb-20">
                  <h3 className="mb-10">{q.text}</h3>
                  {q.options.map((opt: string, i: number) => {
                    const isSelected = q.userChoice === i;
                    const isCorrect = q.correct_idx === i;
                    return (
                      <div key={i} className={`radio-option ${isSelected && !q.isCorrect ? 'wrong-border' : ''} ${isCorrect ? 'right-border' : ''}`}>
                        {opt} {isSelected && !q.isCorrect && '❌'} {isCorrect && '✅'}
                      </div>
                    );
                  })}
                </div>
              ))}
              <button onClick={() => setShowReview(false)}>HIDE SOLUTIONS</button>
            </div>
          ) : (
            <>
              <div className="capture-branding flex-col flex-center">
                <img src={`/logo.png`} alt="Logo" className="brand-logo-ui" />
                <h2 className="brand-result">PINKLUNGI GAMES</h2>
                <h5 className="capture-link">pinklungigames.com</h5>
              </div>
              <div className="no-capture flex-col gap-10">
                <button onClick={() => setShowReview(true)}>VIEW SOLUTIONS</button>
                <button onClick={handleShareImage}>SHARE RESULT</button>
                <button onClick={() => window.location.reload()}>PLAY AGAIN</button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="brand-name mb-20">{title}</h1>
      <div className="progress-indicator bold mb-20">
        Question {currentIdx + 1} of {data.questions.length}
      </div>

      <div className="game-card">
        <h3>{data.questions[currentIdx].text}</h3>
        <div className="radio-group">
          {data.questions[currentIdx].options.map((opt: string, i: number) => (
            <label key={i} className="radio-option">
              <input type="radio" name="quiz" checked={selectedOption === i} onChange={() => setSelectedOption(i)} />
              {opt}
            </label>
          ))}
        </div>
        <button className="submit-btn" disabled={selectedOption === null} onClick={handleSubmit}>Submit Answer</button>
      </div>
    </div>
  );
}
