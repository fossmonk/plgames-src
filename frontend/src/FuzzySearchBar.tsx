import { useState, useMemo } from 'react';
import Fuse from 'fuse.js';

export const FuzzySearchBar = ({ quizzes, onSelect }: any) => {
  const [searchTerm, setSearchTerm] = useState("");

  const fuse = useMemo(() => new Fuse(quizzes, { 
    keys: ['title'], 
    threshold: 0.3 
  }), [quizzes]);

  const results = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return fuse.search(searchTerm).map(r => r.item);
  }, [searchTerm, fuse]);

  return (
    <div className="pinklungi-search-wrapper">
      <div className="input-container">
        <input
          type="text"
          className="brand-input"
          placeholder="Search for a game..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
        />
        <button className="brand-search-btn">🔍</button>
      </div>

      {/* Results Panel: Only shows when typing */}
      {searchTerm.trim() !== "" && (
        <div className="search-results-panel">
          {results.length > 0 ? (
            <ul className="results-list">
              {results.map((quiz: any) => (
                <li key={quiz.id} onClick={() => onSelect(quiz)}>
                  {quiz.title}
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-results">No games found...</p>
          )}
        </div>
      )}
    </div>
  );
};